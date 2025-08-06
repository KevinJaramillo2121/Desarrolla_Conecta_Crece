
const express = require('express');
const router = express.Router();
const path = require('path');
const protegerRuta = require('../middlewares/authMiddleware');
const pool = require('../db');
const multer = require('multer');
const fs = require('fs');

// 1. Definir uploadsDir como ruta absoluta
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 2. Configuración de Multer usando uploadsDir
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, Date.now() + '-' + sanitized);
    }
});
const fileFilter = (req, file, cb) => {
    const allowed = [
        'application/pdf',
        'image/jpeg','image/jpg','image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    cb(null, allowed.includes(file.mimetype));
};
const upload = multer({ storage, limits:{ fileSize:20*1024*1024 }, fileFilter })
    .fields([
        { name:'camara_comercio', maxCount:1 },
        { name:'rut', maxCount:1 },
        { name:'certificado_tamano_file', maxCount:1 },
        { name:'afiliacion_comfama', maxCount:1 },
        { name:'hoja_vida', maxCount:1 },
        { name:'otros_documentos', maxCount:1 },
        { name: 'firma_digital',           maxCount: 1 }
        
    ]);

// Vista principal del participante
router.get('/', protegerRuta('Participante'), (req, res) => {
    res.sendFile(path.resolve(__dirname, '../views_protegidas/participante.html'));
});

// Vista del formulario
router.get('/formulario', protegerRuta('Participante'), async (req, res) => {
    const user = req.session.usuario;
    if (!user.empresaId) {
        return res.send('Debes completar el registro de tu empresa antes de continuar.');
    }
    const { rows } = await pool.query(
        'SELECT 1 FROM postulaciones WHERE empresa_id=$1 AND estado=$2',
        [user.empresaId, 'enviado']
    );
    if (rows.length) {
        return res.send('Ya enviaste tu postulación. No puedes modificarla.');
    }
    res.sendFile(path.resolve(__dirname, '../views_protegidas/formulario.html'));
});

// Enviar postulación (con archivos)
router.post('/enviar-postulacion', protegerRuta('Participante'), upload, async (req, res) => {
    const client = await pool.connect();
    
    try {
        console.log('=== DEBUG BACKEND ===');
        console.log('req.session.usuario:', req.session.usuario);
        console.log('req.body keys:', Object.keys(req.body));
        console.log('req.files keys:', req.files ? Object.keys(req.files) : 'No files');
        
        let empresaId = req.session.usuario.empresaId;
        console.log('empresaId inicial:', empresaId);
        
        // ✅ SI NO TIENE EMPRESA, CREARLA DESDE EL FORMULARIO
        if (!empresaId) {
            console.log('Usuario sin empresa asociada, creando nueva empresa...');
            
            const {
                nombre_legal, nit, persona_juridica, tipo_empresa,
                representante, cedula_representante, correo_contacto,
                telefono_contacto, municipio, direccion, fuera_valle,
                afiliada_comfama, tiene_trabajador
            } = req.body;
            
            // Validar datos de empresa
            if (!nombre_legal || !nit || !representante || !cedula_representante) {
                return res.status(400).json({ 
                    error: 'Faltan datos obligatorios de la empresa' 
                });
            }
            
            await client.query('BEGIN');
            
            // Crear empresa
            const empresaResult = await client.query(`
                INSERT INTO empresas (
                    nombre_legal, nit, persona_juridica, tipo_empresa,
                    representante, cedula_representante, correo_contacto,
                    telefono_contacto, municipio, direccion, fuera_valle,
                    afiliada_comfama, tiene_trabajador, certificado_tamano, declaracion_veraz
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id
            `, [
                nombre_legal, nit, 
                persona_juridica === 'true' || persona_juridica === true,
                tipo_empresa || 'Micro', representante, cedula_representante, correo_contacto,
                telefono_contacto, municipio, direccion || 'No especificada',
                fuera_valle === 'true' || fuera_valle === true,
                afiliada_comfama === 'true' || afiliada_comfama === true,
                tiene_trabajador === 'true' || tiene_trabajador === true,
                true, true // certificado_tamano y declaracion_veraz por defecto
            ]);
            
            empresaId = empresaResult.rows[0].id;
            
            // Actualizar usuario con empresa_id
            await client.query(
                'UPDATE usuarios SET empresa_id = $1 WHERE id = $2',
                [empresaId, req.session.usuario.id]
            );
            
            // Actualizar sesión
            req.session.usuario.empresaId = empresaId;
            
            console.log('Empresa creada con ID:', empresaId);
        } else {
            await client.query('BEGIN');
        }
        
        // Verificar que no haya enviado ya su postulación
        const yaPostulo = await client.query(
            'SELECT * FROM postulaciones WHERE empresa_id = $1 AND estado = $2',
            [empresaId, 'enviado']
        );

        if (yaPostulo.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Ya enviaste tu postulación. No puedes modificarla.' });
        }
        
        console.log('Procesando postulación para empresa ID:', empresaId);
        
        const uploadedFiles = req.files || {};
        
        // Debug de campos recibidos
        console.log('Campo producto_info raw:', req.body.producto_info);
        console.log('Campo brechas raw:', req.body.brechas);
        console.log('Campo motivacion raw:', req.body.motivacion);
        
        // ✅ PARSEO SEGURO DE CAMPOS JSON CON CORRECCIÓN DE ARRAYS
        let producto_info, brechas, motivacion;
        
        try {
            producto_info = req.body.producto_info ? JSON.parse(req.body.producto_info) : {};
            console.log('producto_info parseado:', producto_info);
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Error parsing producto_info:', e);
            return res.status(400).json({ error: "El campo producto_info no es un JSON válido: " + e.message });
        }
        
        try {
            // ✅ SOLUCIÓN: Si brechas es un array, tomar el último elemento
            let brechasRaw = req.body.brechas;
            if (Array.isArray(brechasRaw)) {
                // Tomar el último elemento que contiene el JSON válido
                brechasRaw = brechasRaw[brechasRaw.length - 1];
                console.log('brechas extraído del array:', brechasRaw);
            }
            brechas = brechasRaw ? JSON.parse(brechasRaw) : {};
            console.log('brechas parseado:', brechas);
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Error parsing brechas:', e);
            return res.status(400).json({ error: "El campo brechas no es un JSON válido: " + e.message });
        }
        
        try {
            // ✅ APLICAR LA MISMA LÓGICA A MOTIVACION por si acaso
            let motivacionRaw = req.body.motivacion;
            if (Array.isArray(motivacionRaw)) {
                motivacionRaw = motivacionRaw[motivacionRaw.length - 1];
                console.log('motivacion extraído del array:', motivacionRaw);
            }
            motivacion = motivacionRaw ? JSON.parse(motivacionRaw) : {};
            console.log('motivacion parseado:', motivacion);
        } catch (e) {
            await client.query('ROLLBACK');
            console.error('Error parsing motivacion:', e);
            return res.status(400).json({ error: "El campo motivacion no es un JSON válido: " + e.message });
        }
        
        // Verificar si ya existe una postulación
        const postulacionResult = await client.query(
            'SELECT * FROM postulaciones WHERE empresa_id = $1',
            [empresaId]
        );
        
        if (postulacionResult.rows.length === 0) {
            console.log('Insertando nueva postulación...');
            await client.query(
                'INSERT INTO postulaciones (empresa_id, estado, producto_info, brechas, motivacion, fecha_envio) VALUES ($1, $2, $3, $4, $5, now())',
                [empresaId, 'enviado', producto_info, brechas, motivacion]
            );
        } else {
            console.log('Actualizando postulación existente...');
            await client.query(
                'UPDATE postulaciones SET estado = $1, producto_info = $2, brechas = $3, motivacion = $4, fecha_envio = now() WHERE empresa_id = $5',
                ['enviado', producto_info, brechas, motivacion, empresaId]
            );
        }
        
        // ✅ MANEJAR LA SUBIDA DE DOCUMENTOS CON CORRECCIONES
        for (const fieldName in uploadedFiles) {
            const filesArray = uploadedFiles[fieldName];
            for (const archivo of filesArray) {
                console.log(`Guardando documento: ${archivo.originalname}`);
                
                // ✅ DETERMINAR CATEGORÍA CORRECTA
                let categoria = 'Otro';
                switch(fieldName) {
                    case 'camara_comercio': categoria = 'CamaraComercio'; break;
                    case 'rut': categoria = 'RUT'; break;
                    case 'certificado_tamano_file': categoria = 'TamanoEmpresarial'; break;
                    case 'afiliacion_comfama': categoria = 'AfiliacionComfama'; break;
                    case 'hoja_vida': categoria = 'HojaVidaProducto'; break;
                    case 'otros_documentos': categoria = 'Otro'; break;
                }
                
                const documentoQuery = `
                    INSERT INTO documentos(empresa_id, categoria, nombre_original, nombre_guardado, tipo_archivo, ruta, tamano_bytes)
                    VALUES($1, $2, $3, $4, $5, $6, $7)
                `;
                
                await client.query(documentoQuery, [
                    empresaId,
                    categoria,
                    archivo.originalname,
                    archivo.filename,
                    archivo.mimetype,
                    archivo.path,
                    archivo.size || 0
                ]);
            }
        }
        
        await client.query('COMMIT');
        console.log('Postulación guardada exitosamente');
        res.json({ mensaje: 'Postulación y documentos enviados correctamente.' });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error completo en enviar-postulacion:', error);
        res.status(500).json({ 
            error: 'Error al enviar la postulación',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        client.release();
    }
});

// ✅ GUARDAR BORRADOR CORREGIDO
router.post('/guardar-borrador', protegerRuta('Participante'), async (req, res) => {
    const client = await pool.connect();
    try {
        const empresaId = req.session.usuario.empresaId;
        
        if (!empresaId) {
            return res.status(400).json({ error: 'No se encontró empresa asociada' });
        }
        
        let producto_info, brechas, motivacion;
        
        try {
            producto_info = req.body.producto_info ? JSON.parse(req.body.producto_info) : {};
            
            // ✅ MISMA LÓGICA PARA BRECHAS
            let brechasRaw = req.body.brechas;
            if (Array.isArray(brechasRaw)) {
                brechasRaw = brechasRaw[brechasRaw.length - 1];
            }
            brechas = brechasRaw ? JSON.parse(brechasRaw) : {};
            
            // ✅ MISMA LÓGICA PARA MOTIVACION
            let motivacionRaw = req.body.motivacion;
            if (Array.isArray(motivacionRaw)) {
                motivacionRaw = motivacionRaw[motivacionRaw.length - 1];
            }
            motivacion = motivacionRaw ? JSON.parse(motivacionRaw) : {};
            
        } catch (e) {
            return res.status(400).json({ error: "Al menos uno de los campos principales no es un JSON válido." });
        }
        
        const existing = await client.query(
            'SELECT id, estado FROM postulaciones WHERE empresa_id = $1',
            [empresaId]
        );
        
        if (existing.rows.length > 0) {
            if (existing.rows[0].estado === 'enviado') {
                return res.status(403).json({ error: 'Ya enviaste tu postulación. No puedes modificarla.' });
            }
            
            await client.query(`
                UPDATE postulaciones
                SET producto_info = $1, brechas = $2, motivacion = $3, fecha_actualizacion = now()
                WHERE empresa_id = $4
            `, [producto_info, brechas, motivacion, empresaId]);
        } else {
            await client.query(`
                INSERT INTO postulaciones (empresa_id, producto_info, brechas, motivacion, estado)
                VALUES ($1, $2, $3, $4, 'borrador')
            `, [empresaId, producto_info, brechas, motivacion]);
        }
        
        res.json({ mensaje: 'Guardado como borrador.' });
    } catch (error) {
        console.error('Error guardando borrador:', error);
        res.status(500).json({ error: 'Error al guardar el borrador.' });
    } finally {
        client.release();
    }
});

// Obtener estado de postulación
router.get('/estado-postulacion', protegerRuta('Participante'), async (req, res) => {
    try {
        const empresaId = req.session.usuario.empresaId;
        
        if (!empresaId) {
            return res.json({ estado: 'sin_empresa' });
        }
        
        const result = await pool.query(
            'SELECT estado FROM postulaciones WHERE empresa_id = $1',
            [empresaId]
        );
        
        if (result.rows.length > 0) {
            res.json({ estado: result.rows[0].estado });
        } else {
            res.json({ estado: 'nueva' });
        }
    } catch (error) {
        console.error('Error consultando estado de postulación:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener fecha de cierre de convocatoria
router.get('/fecha-cierre', async (req, res) => {
    try {
        const result = await pool.query('SELECT fecha_fin FROM convocatoria ORDER BY id DESC LIMIT 1');
        if (result.rows.length > 0) {
            res.json({ fechaFin: result.rows[0].fecha_fin });
        } else {
            res.status(404).json({ error: 'No se encontró convocatoria activa' });
        }
    } catch (error) {
        console.error('Error obteniendo fecha de cierre:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
