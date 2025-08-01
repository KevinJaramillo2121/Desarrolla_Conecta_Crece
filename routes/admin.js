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


module.exports = router;
