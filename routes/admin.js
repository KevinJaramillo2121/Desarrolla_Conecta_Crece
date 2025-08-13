const express = require('express');
const router = express.Router();
const path = require('path');
const protegerRuta = require('../middlewares/authMiddleware');
const pool = require('../db');

router.get('/', protegerRuta('Administrador'), (req, res) => {
    const filePath = path.resolve(__dirname, '../views_protegidas/admin.html');
    res.sendFile(filePath);
});

router.get('/convocatoria', protegerRuta('Administrador'), async (req, res) => {
  const result = await pool.query('SELECT * FROM convocatoria ORDER BY id DESC LIMIT 1');
res.json(result.rows[0] || null);
});

// Vista funcional del panel administrativo
router.get('/panel', protegerRuta('Administrador'), (req, res) => {
    res.sendFile(path.resolve(__dirname, '../views_protegidas/administracion.html'));
});

router.post('/convocatoria', protegerRuta('Administrador'), async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.body;

    if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Fechas requeridas' });
    }

    try {
        const count = await pool.query('SELECT COUNT(*) FROM convocatoria');
        if (parseInt(count.rows[0].count) === 0) {
        // Crear nueva
        await pool.query('INSERT INTO convocatoria (fecha_inicio, fecha_fin) VALUES ($1, $2)', [fecha_inicio, fecha_fin]);
        } else {
        // Actualizar última
        await pool.query('UPDATE convocatoria SET fecha_inicio = $1, fecha_fin = $2 WHERE id = (SELECT id FROM convocatoria ORDER BY id DESC LIMIT 1)', [fecha_inicio, fecha_fin]);
        }

        res.json({ mensaje: 'Fechas de convocatoria actualizadas.' });

    } catch (error) {
        console.error('Error al actualizar fechas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

router.get('/postulaciones', protegerRuta('Administrador'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.id AS empresa_id,
                   e.nombre_legal,
                   e.nit,
                   e.tipo_empresa,
                   e.municipio,
                   p.estado AS estado_postulacion,
                   s.estado_preseleccion,
                   s.es_definitiva,
                   u.nombre_completo AS evaluador
            FROM empresas e
            LEFT JOIN postulaciones p
                ON p.empresa_id = e.id AND p.estado = 'enviado'
            LEFT JOIN seleccion s
                ON s.empresa_id = e.id
            LEFT JOIN usuarios u
                ON u.id = s.evaluador_id
            ORDER BY e.nombre_legal, s.es_definitiva DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener postulaciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

    router.post('/evaluadores', protegerRuta('Administrador'), async (req, res) => {
    const { nombre_usuario, correo, password, nombre_completo } = req.body;
    if (!nombre_usuario || !correo || !password || !nombre_completo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    try {
        // Obtener rol Evaluador
        const rolRes = await pool.query(
        "SELECT id FROM roles WHERE nombre = 'Evaluador'"
        );
        const rol_id = rolRes.rows[0].id;
        // Hashear contraseña
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash(password, 10);
        // Insertar usuario
        await pool.query(
        `INSERT INTO usuarios (
            nombre_usuario, correo, password_hash, nombre_completo, rol_id
        ) VALUES ($1,$2,$3,$4,$5)`,
        [nombre_usuario, correo, hash, nombre_completo, rol_id]
        );
        res.json({ mensaje: 'Evaluador creado exitosamente.' });
    } catch (error) {
        console.error('Error creando evaluador:', error);
        res.status(500).json({ error: 'Error del servidor.' });
    }
    });

    router.post('/evaluar-definitivo', protegerRuta('Administrador'), async (req, res) => {
    const { empresa_id, estado_preseleccion, observaciones, criterios } = req.body;
    const adminId = req.session.usuario.id;

    try {
        const existe = await pool.query(
            'SELECT id FROM seleccion WHERE empresa_id = $1 AND evaluador_id = $2 AND es_definitiva = true',
            [empresa_id, adminId]
        );

        if (existe.rows.length > 0) {
            await pool.query(`
                UPDATE seleccion
                SET estado_preseleccion = $1,
                    observaciones = $2,
                    criterios_evaluacion = $3,
                    fecha_actualizacion = now(),
                    es_definitiva = true
                WHERE empresa_id = $4 AND evaluador_id = $5
            `, [estado_preseleccion, observaciones, criterios, empresa_id, adminId]);
        } else {
            await pool.query(`
                INSERT INTO seleccion (empresa_id, estado_preseleccion, observaciones, criterios_evaluacion, evaluador_id, es_definitiva)
                VALUES ($1, $2, $3, $4, $5, true)
            `, [empresa_id, estado_preseleccion, observaciones, criterios, adminId]);
        }

        res.json({ mensaje: '✅ Evaluación definitiva registrada correctamente' });
    } catch (error) {
        console.error('Error en evaluación definitiva:', error);
        res.status(500).json({ error: '❌ Error del servidor' });
    }
});
// Obtener todas las evaluaciones de una empresa
router.get('/evaluaciones/:empresaId', protegerRuta('Administrador'), async (req, res) => {
    const { empresaId } = req.params;
    try {
        const result = await pool.query(`
            SELECT s.*, u.nombre_completo, u.rol
            FROM seleccion s
            JOIN usuarios u ON u.id = s.evaluador_id
            WHERE s.empresa_id = $1
            ORDER BY es_definitiva DESC, fecha_actualizacion DESC
        `, [empresaId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener evaluaciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});


module.exports = router;
