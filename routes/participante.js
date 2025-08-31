
const express = require('express');
const router = express.Router();
const path = require('path');
const protegerRuta = require('../middlewares/authMiddleware');
const pool = require('../db');
const multer = require('multer'); // <--- AÑADE ESTO
const upload = multer();          // <--- Y ESTO


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
router.post('/enviar-postulacion', protegerRuta('Participante'), upload.any(), async (req, res) => { 
    const client = await pool.connect();
    
    try {
        console.log('=== INICIO PROCESAMIENTO POSTULACIÓN ===');
        console.log('Usuario:', req.session.usuario);
        console.log('Archivos recibidos:', req.files ? Object.keys(req.files) : 'Ninguno');
        console.log('Campos recibidos:', Object.keys(req.body));

        let empresaId = req.session.usuario?.empresaId;
        console.log('EmpresaId inicial:', empresaId);

        await client.query('BEGIN');

        // VALIDACIÓN INICIAL
        if (!req.session.usuario || !req.session.usuario.id) {
            await client.query('ROLLBACK');
            return res.status(401).json({ error: 'Sesión no válida' });
        }

        // SI NO TIENE EMPRESA, CREARLA
        if (!empresaId) {
            console.log('Creando nueva empresa...');
            const empresaData = extraerDatosEmpresa(req.body);
            
            // Validar datos mínimos de empresa
            if (!empresaData.nombre_legal || !empresaData.nit || !empresaData.representante) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    error: 'Faltan datos obligatorios de la empresa: nombre legal, NIT y representante son requeridos' 
                });
            }

            const empresaResult = await client.query(`
                INSERT INTO empresas (
                    nombre_legal, nit, persona_juridica, tipo_empresa,
                    representante, cedula_representante, correo_contacto,
                    telefono_contacto, municipio, direccion, fuera_valle,
                    afiliada_comfama, tiene_trabajador, certificado_tamano, declaracion_veraz
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id
            `, [
                empresaData.nombre_legal,
                empresaData.nit,
                empresaData.persona_juridica,
                empresaData.tipo_empresa || 'Micro',
                empresaData.representante,
                empresaData.cedula_representante,
                empresaData.correo_contacto,
                empresaData.telefono_contacto,
                empresaData.municipio,
                empresaData.direccion || 'No especificada',
                empresaData.fuera_valle,
                empresaData.afiliada_comfama,
                empresaData.tiene_trabajador,
                true, // certificado_tamano
                true  // declaracion_veraz
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
        }

        // VERIFICAR QUE NO HAYA ENVIADO YA SU POSTULACIÓN
        const yaPostulo = await client.query(
            'SELECT id FROM postulaciones WHERE empresa_id = $1 AND estado = $2',
            [empresaId, 'enviado']
        );

        if (yaPostulo.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'Ya enviaste tu postulación. No puedes modificarla.' 
            });
        }

        // PROCESAR CAMPOS JSON CON MANEJO DE ERRORES MEJORADO
        console.log('Procesando campos JSON...');
        const { producto_info, brechas, motivacion } = procesarCamposJSON(req.body);

        // VALIDAR CAMPOS PRINCIPALES
        if (!producto_info.nombre || !producto_info.descripcion) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'El nombre y descripción del producto son obligatorios' 
            });
        }

        // GUARDAR O ACTUALIZAR POSTULACIÓN
        const postulacionExistente = await client.query(
            'SELECT id FROM postulaciones WHERE empresa_id = $1',
            [empresaId]
        );

        if (postulacionExistente.rows.length === 0) {
            console.log('Insertando nueva postulación...');
            await client.query(`
                INSERT INTO postulaciones (empresa_id, estado, producto_info, brechas, motivacion, fecha_envio) 
                VALUES ($1, $2, $3, $4, $5, now())
            `, [empresaId, 'enviado', producto_info, brechas, motivacion]);
        } else {
            console.log('Actualizando postulación existente...');
            await client.query(`
                UPDATE postulaciones 
                SET estado = $1, producto_info = $2, brechas = $3, motivacion = $4, fecha_envio = now(), fecha_actualizacion = now()
                WHERE empresa_id = $5
            `, ['enviado', producto_info, brechas, motivacion, empresaId]);
        }

        await client.query('COMMIT');
        console.log('✅ Postulación guardada exitosamente');

        res.status(200).json({ 
            mensaje: 'Postulación enviada correctamente. ¡Gracias por participar!',
            empresaId: empresaId
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error completo en enviar-postulacion:', error);
        
        res.status(500).json({
            error: 'Error interno del servidor al procesar la postulación',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Contacta al administrador'
        });
    } finally {
        client.release();
    }
});

// Funciones auxiliares para el backend
function extraerDatosEmpresa(body) {
    return {
        nombre_legal: body.nombre_legal?.trim(),
        nit: body.nit?.trim(),
        persona_juridica: body.persona_juridica === 'true' || body.persona_juridica === true,
        tipo_empresa: body.tipo_empresa || 'Micro',
        representante: body.representante?.trim(),
        cedula_representante: body.cedula_representante?.trim(),
        correo_contacto: body.correo_contacto?.trim(),
        telefono_contacto: body.telefono_contacto?.trim(),
        municipio: body.municipio?.trim(),
        direccion: body.direccion?.trim(),
        fuera_valle: body.fuera_valle === 'true' || body.fuera_valle === true,
        afiliada_comfama: body.afiliada_comfama === 'true' || body.afiliada_comfama === true,
        tiene_trabajador: body.tiene_trabajador === 'true' || body.tiene_trabajador === true
    };
}

function procesarCamposJSON(body) {
    let producto_info, brechas, motivacion;

    try {
        // Manejar producto_info
        let productoRaw = body.producto_info;
        if (Array.isArray(productoRaw)) {
            productoRaw = productoRaw[productoRaw.length - 1];
        }
        producto_info = productoRaw ? JSON.parse(productoRaw) : {};
        console.log('✅ producto_info procesado');

        // Manejar brechas
        let brechasRaw = body.brechas;
        if (Array.isArray(brechasRaw)) {
            brechasRaw = brechasRaw[brechasRaw.length - 1];
        }
        brechas = brechasRaw ? JSON.parse(brechasRaw) : {};
        console.log('✅ brechas procesado');

        // Manejar motivacion
        let motivacionRaw = body.motivacion;
        if (Array.isArray(motivacionRaw)) {
            motivacionRaw = motivacionRaw[motivacionRaw.length - 1];
        }
        motivacion = motivacionRaw ? JSON.parse(motivacionRaw) : {};
        console.log('✅ motivacion procesado');

        return { producto_info, brechas, motivacion };

    } catch (error) {
        console.error('Error procesando campos JSON:', error);
        throw new Error(`Error en el formato de los datos: ${error.message}`);
    }
}

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
