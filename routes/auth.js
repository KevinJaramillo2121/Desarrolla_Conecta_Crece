const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuración de la base de datos (ajústala según tu entorno)
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'convocatoria_db',
    password: 'postgresql',
    port: 5432,
});

// Ruta POST /register
router.post('/register', async (req, res) => {
    try {
        const {
            nombre_usuario,
            correo,
            password,
            nombre_completo,
            nombre_legal,
            nit,
            persona_juridica,
            tipo_empresa,
            representante,
            cedula_representante,
            telefono_contacto,
            municipio,
            direccion,
            fuera_valle,
            afiliada_comfama,
            tiene_trabajador
        } = req.body;

        // Validar datos mínimos
        if (!nombre_usuario || !correo || !password || !nombre_completo || !nombre_legal || !nit) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios.' });
        }

        // Hashear la contraseña con bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Obtener el ID del rol participante
        const resultRol = await pool.query(
            "SELECT id FROM roles WHERE nombre = 'Participante'"
        );
        const rol_id = resultRol.rows[0].id;

        // Iniciar transacción
        await pool.query('BEGIN');

        // Insertar empresa
        const empresaResult = await pool.query(
            `INSERT INTO empresas (
                nombre_legal, nit, persona_juridica, tipo_empresa,
                representante, cedula_representante, correo_contacto,
                telefono_contacto, municipio, direccion, fuera_valle,
                afiliada_comfama, tiene_trabajador
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
            [
                nombre_legal, nit, persona_juridica, tipo_empresa,
                representante, cedula_representante, correo,
                telefono_contacto, municipio, direccion, fuera_valle,
                afiliada_comfama, tiene_trabajador
            ]
        );
        const empresa_id = empresaResult.rows[0].id;

        // Insertar usuario
        await pool.query(
            `INSERT INTO usuarios (
                nombre_usuario, correo, password_hash, nombre_completo, rol_id
            ) VALUES ($1, $2, $3, $4, $5)`,
            [nombre_usuario, correo, hashedPassword, nombre_completo, rol_id]
        );

        // Confirmar transacción
        await pool.query('COMMIT');

        res.status(201).json({ mensaje: 'Usuario participante registrado exitosamente.' });

    } catch (error) {
        console.error('Error en /register:', error);
        await pool.query('ROLLBACK');
        res.status(500).json({ mensaje: 'Error en el servidor.' });
    }
});

    // Ruta POST /login
    router.post('/login', async (req, res) => {
    const { nombre_usuario, password } = req.body;

    if (!nombre_usuario || !password) {
        return res.status(400).json({ mensaje: 'Faltan campos' });
    }

    try {
        // Buscar al usuario
        const result = await pool.query(
        `SELECT u.id, u.nombre_usuario, u.password_hash, u.rol_id, r.nombre AS rol
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.nombre_usuario = $1 AND u.activo = true`,
        [nombre_usuario]
        );

        if (result.rows.length === 0) {
        return res.status(401).json({ mensaje: 'Usuario no encontrado o inactivo' });
        }

        const usuario = result.rows[0];

        // Verificar la contraseña con bcrypt
        const esValida = await bcrypt.compare(password, usuario.password_hash);

        if (!esValida) {
        return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        // Guardar datos en la sesión
        req.session.usuario = {
        id: usuario.id,
        nombre: usuario.nombre_usuario,
        rol: usuario.rol
        };

        // Redirigir según el rol
        let redireccion = '/';
        if (usuario.rol === 'Administrador') redireccion = '/admin';
        else if (usuario.rol === 'Evaluador') redireccion = '/evaluador';
        else if (usuario.rol === 'Participante') redireccion = '/participante';

        res.json({ mensaje: 'Login exitoso', redireccion });

    } catch (error) {
        console.error('Error en /login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
    });


module.exports = router;
