    const express = require('express');
    const router = express.Router();
    const path = require('path');
    const protegerRuta = require('../middlewares/authMiddleware');
    const { Pool } = require('pg');
    const multer = require('multer');

    // Configuración de Multer para archivos
    const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
    });

    const upload = multer({ storage: storage }).fields([
    { name: 'camara_comercio', maxCount: 1 },
    { name: 'rut', maxCount: 1 },
    { name: 'certificado_tamano_file', maxCount: 1 },
    { name: 'afiliacion_comfama', maxCount: 1 },
    { name: 'hoja_vida', maxCount: 1 },
    { name: 'otros_documentos', maxCount: 1 }
    ]);

    const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'convocatoria_db',
    password: 'postgresql',
    port: 5432,
    });

    // Vista principal del participante
    router.get('/', protegerRuta('Participante'), (req, res) => {
    const filePath = path.resolve(__dirname, '../views_protegidas/participante.html');
    res.sendFile(filePath);
    });

    // Vista del formulario
    router.get('/formulario', protegerRuta('Participante'), async (req, res) => {
    const user = req.session.usuario;
    const yaPostulo = await pool.query(
        'SELECT * FROM postulaciones WHERE empresa_id = $1 AND estado = $2',
        [user.empresaId, 'enviado']
    );

    if (yaPostulo.rows.length > 0) {
        return res.send('Ya enviaste tu postulación. No puedes modificarla.');
    }
    res.sendFile(path.resolve(__dirname, '../views_protegidas/formulario.html'));
    });

    // Enviar postulación (con archivos)
    router.post('/enviar-postulacion', protegerRuta('Participante'), upload, async (req, res) => {
    const client = await pool.connect();
    try {
        const empresaId = req.session.usuario.empresaId;
        const uploadedFiles = req.files || {};

        // Parseo seguro de campos JSON
        let producto_info, brechas, motivacion;
        try {
        producto_info = req.body.producto_info ? JSON.parse(req.body.producto_info) : {};
        brechas = req.body.brechas ? JSON.parse(req.body.brechas) : {};
        motivacion = req.body.motivacion ? JSON.parse(req.body.motivacion) : {};
        } catch (e) {
        return res.status(400).json({ error: "Al menos uno de los campos principales no es un JSON válido." });
        }

        await client.query('BEGIN');

        const postulacionResult = await client.query(
        'SELECT * FROM postulaciones WHERE empresa_id = $1',
        [empresaId]
        );

        if (postulacionResult.rows.length === 0) {
        await client.query(
            'INSERT INTO postulaciones (empresa_id, estado, producto_info, brechas, motivacion, fecha_envio) VALUES ($1, $2, $3, $4, $5, now())',
            [empresaId, 'enviado', producto_info, brechas, motivacion]
        );
        } else {
        await client.query(
            'UPDATE postulaciones SET estado = $1, producto_info = $2, brechas = $3, motivacion = $4, fecha_envio = now() WHERE empresa_id = $5',
            ['enviado', producto_info, brechas, motivacion, empresaId]
        );
        }

        // Manejar la subida de documentos
        for (const fieldName in uploadedFiles) {
        const filesArray = uploadedFiles[fieldName];
        for (const archivo of filesArray) {
            const documentoQuery = `
            INSERT INTO documentos(nombre_original, nombre_guardado, tipo_archivo, ruta, empresa_id)
            VALUES($1, $2, $3, $4, $5)
            `;
            await client.query(documentoQuery, [
            archivo.originalname,
            archivo.filename,
            archivo.mimetype,
            archivo.path,
            empresaId
            ]);
        }
        }

        await client.query('COMMIT');
        res.json({ mensaje: 'Postulación y documentos enviados correctamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error enviando postulación:', error);
        res.status(500).json({ error: 'Error al enviar la postulación.' });
    } finally {
        client.release();
    }
    });

    // Guardar borrador
    router.post('/guardar-borrador', protegerRuta('Participante'), async (req, res) => {
    const client = await pool.connect();
    try {
        const empresaId = req.session.usuario.empresaId;
        let producto_info, brechas, motivacion;
        try {
        producto_info = req.body.producto_info ? JSON.parse(req.body.producto_info) : {};
        brechas = req.body.brechas ? JSON.parse(req.body.brechas) : {};
        motivacion = req.body.motivacion ? JSON.parse(req.body.motivacion) : {};
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
