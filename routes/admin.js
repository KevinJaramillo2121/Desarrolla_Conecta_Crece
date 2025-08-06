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
        const result = await pool.query('SELECT * FROM vista_general ORDER BY nombre_legal');
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

module.exports = router;
