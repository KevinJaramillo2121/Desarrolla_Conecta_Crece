const express = require('express');
const router = express.Router();
const path = require('path');
const protegerRuta = require('../middlewares/authMiddleware');
const pool = require('../db');

router.get('/', protegerRuta('Evaluador'), (req, res) => {
    const filePath = path.resolve(__dirname, '../views_protegidas/evaluador.html');
    res.sendFile(filePath);
});

router.get('/evaluacion', protegerRuta('Evaluador'), (req, res) => {
    res.sendFile(path.resolve(__dirname, '../views_protegidas/evaluacion.html'));
});

router.get('/postulaciones', protegerRuta('Evaluador'), async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT id, nombre_legal, tipo_empresa, municipio, estado_postulacion, estado_preseleccion
        FROM vista_general
        WHERE estado_postulacion = 'enviado'
        ORDER BY nombre_legal
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error cargando postulaciones:', error);
        res.status(500).json({ error: 'Error al obtener postulaciones' });
    }
});

router.get('/evaluador/postulacion/:empresaId', protegerRuta('Evaluador'), async (req, res) => {
    const { empresaId } = req.params;
    try {
        const empresa = await pool.query('SELECT * FROM empresas WHERE id = $1', [empresaId]);
        const post = await pool.query('SELECT * FROM postulaciones WHERE empresa_id = $1 AND estado = $2', [empresaId, 'enviado']);
        res.json({
        empresa: empresa.rows[0],
        postulacion: post.rows[0]
        });
    } catch (err) {
        console.error('Error cargando detalle:', err);
        res.status(500).json({ error: 'Error al obtener detalle de postulación' });
    }
});

router.post('/evaluador/evaluar', protegerRuta('Evaluador'), async (req, res) => {
    const { empresa_id, estado_preseleccion, observaciones, criterios } = req.body;
    const evaluadorId = req.session.usuario.id;

    try {
        // Si ya existe, actualiza
        const existe = await pool.query('SELECT id FROM seleccion WHERE empresa_id = $1', [empresa_id]);

        if (existe.rows.length > 0) {
        await pool.query(`
            UPDATE seleccion
            SET estado_preseleccion = $1,
                observaciones = $2,
                criterios_evaluacion = $3,
                evaluador_id = $4,
                fecha_actualizacion = now()
            WHERE empresa_id = $5
        `, [estado_preseleccion, observaciones, criterios, evaluadorId, empresa_id]);
        } else {
        await pool.query(`
            INSERT INTO seleccion (empresa_id, estado_preseleccion, observaciones, criterios_evaluacion, evaluador_id)
            VALUES ($1, $2, $3, $4, $5)
        `, [empresa_id, estado_preseleccion, observaciones, criterios, evaluadorId]);
        }

        res.json({ mensaje: 'Evaluación registrada correctamente' });
    } catch (error) {
        console.error('Error guardando evaluación:', error);
        res.status(500).json({ error: 'Error al guardar la evaluación' });
    }
});

// 💡 Nueva ruta para obtener la lista de documentos de una empresa
router.get('/documentos/:empresaId', protegerRuta('Evaluador'), async (req, res) => {
    const { empresaId } = req.params;
    try {
        // ✅ CAMBIAR id_empresa por empresa_id
        const result = await pool.query('SELECT id, nombre_original FROM documentos WHERE empresa_id = $1', [empresaId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener documentos para la empresa:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});
// Nueva ruta para descargar documentos
router.get('/descargar-documento/:documentoId', protegerRuta('Evaluador'), async (req, res) => {
    const { documentoId } = req.params;

    try {
        const result = await pool.query('SELECT ruta, nombre_original FROM documentos WHERE id = $1', [documentoId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        const documento = result.rows[0];
        const rutaCompleta = path.join(__dirname, '..', documento.ruta); // 💡 Construye la ruta completa

        // Usar res.download() para enviar el archivo
        res.download(rutaCompleta, documento.nombre_original, (err) => {
            if (err) {
                console.error('Error al descargar el archivo:', err);
                res.status(500).send('Error al descargar el archivo.');
            }
        });

    } catch (error) {
        console.error('Error en la descarga del documento:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
