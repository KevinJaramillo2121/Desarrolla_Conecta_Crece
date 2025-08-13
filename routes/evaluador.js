const express = require('express');
const router = express.Router();
const path = require('path');
const protegerRuta = require('../middlewares/authMiddleware');
const pool = require('../db');
const fs      = require('fs');                

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
            SELECT e.id, e.nombre_legal, e.tipo_empresa, e.municipio,
                   p.estado AS estado_postulacion, 
                   s.estado_preseleccion
            FROM empresas e
            LEFT JOIN postulaciones p
                ON p.empresa_id = e.id AND p.estado = 'enviado'
            LEFT JOIN seleccion s
                ON s.empresa_id = e.id
               AND s.evaluador_id = $1
            WHERE p.estado = 'enviado'
            ORDER BY e.nombre_legal
        `, [req.session.usuario.id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error cargando postulaciones:', error);
        res.status(500).json({ error: 'Error al obtener postulaciones' });
    }
});


router.get('/evaluador/postulacion/:empresaId', protegerRuta('Evaluador'), async (req, res) => {
    const { empresaId } = req.params;
    const evaluadorId = req.session.usuario.id;
    try {
        const empresa = await pool.query('SELECT * FROM empresas WHERE id = $1', [empresaId]);
        const post = await pool.query(
            'SELECT * FROM postulaciones WHERE empresa_id = $1 AND estado = $2',
            [empresaId, 'enviado']
        );
        const miEvaluacion = await pool.query(
            'SELECT * FROM seleccion WHERE empresa_id = $1 AND evaluador_id = $2',
            [empresaId, evaluadorId]
        );

        res.json({
            empresa: empresa.rows[0],
            postulacion: post.rows[0],
            evaluacion: miEvaluacion.rows[0] || null
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
        const existe = await pool.query('SELECT id FROM seleccion WHERE empresa_id = $1 AND evaluador_id = $2',
        [empresa_id, evaluadorId]
    );

    if (existe.rows.length > 0) {
        // Actualizar solo SU evaluación
        await pool.query(`
            UPDATE seleccion
            SET estado_preseleccion = $1,
                observaciones = $2,
                criterios_evaluacion = $3,
                fecha_actualizacion = now()
            WHERE empresa_id = $4 AND evaluador_id = $5
        `, [estado_preseleccion, observaciones, criterios, evaluadorId, empresa_id]);
    } else {
        // Crear nueva fila para este evaluador
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

router.get('/descargar-documento/:id', protegerRuta('Evaluador'), async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query(
            'SELECT ruta, nombre_guardado, nombre_original FROM documentos WHERE id = $1',
            [id]
        );
        if (!rows.length) {
            return res.status(404).json({ error: 'Documento no encontrado en la base de datos' });
        }

        const { ruta, nombre_guardado, nombre_original } = rows[0];

        let filePath;
        if (path.isAbsolute(ruta)) {
            // Si 'ruta' ya incluye el filename, úsala directamente:
            if (ruta.endsWith(nombre_guardado)) {
                filePath = ruta;
            } else {
                filePath = path.join(ruta, nombre_guardado);
            }
        } else {
            // Ruta relativa, ej. 'uploads'
            filePath = path.resolve(__dirname, '..', ruta, nombre_guardado);
        }

        console.log('🔍 Intentando descargar archivo en:', filePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'Archivo físico no encontrado',
                buscado_en: filePath
            });
        }

        res.download(filePath, nombre_original, (err) => {
            if (err) {
                console.error('❌ Error al enviar el archivo:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al descargar el archivo' });
                }
            }
        });
    } catch (error) {
        console.error('❌ Error en descarga de documento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;