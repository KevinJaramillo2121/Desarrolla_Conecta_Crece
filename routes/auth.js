const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // ✅ USAR CONFIGURACIÓN CENTRALIZADA

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

        console.log('Iniciando registro para:', nombre_usuario);

        // Hashear la contraseña con bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        // Obtener el ID del rol participante
        const resultRol = await pool.query(
            "SELECT id FROM roles WHERE nombre = 'Participante'"
        );
        const rol_id = resultRol.rows[0].id;
        console.log('Rol ID obtenido:', rol_id);

        // Iniciar transacción
        await pool.query('BEGIN');
        console.log('Transacción iniciada');

        // ✅ INSERTAR EMPRESA (CORREGIDO - parámetros en array)
        const empresaResult = await pool.query(
            `INSERT INTO empresas (
                nombre_legal, nit, persona_juridica, tipo_empresa,
                representante, cedula_representante, correo_contacto,
                telefono_contacto, municipio, direccion, fuera_valle,
                afiliada_comfama, tiene_trabajador
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
            [  // ✅ AQUÍ ESTABA EL ERROR - FALTABA EL ARRAY
                nombre_legal, nit, persona_juridica, tipo_empresa,
                representante, cedula_representante, correo,
                telefono_contacto, municipio, direccion, fuera_valle,
                afiliada_comfama, tiene_trabajador
            ]
        );
        const empresa_id = empresaResult.rows[0].id;
        console.log('Empresa creada con ID:', empresa_id);

        // ✅ INSERTAR USUARIO CON empresa_id
        await pool.query(
            `INSERT INTO usuarios (
                nombre_usuario, correo, password_hash, nombre_completo, rol_id, empresa_id
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [nombre_usuario, correo, hashedPassword, nombre_completo, rol_id, empresa_id]
        );
        console.log('Usuario creado y asociado a empresa ID:', empresa_id);

        // Confirmar transacción
        await pool.query('COMMIT');
        console.log('Transacción confirmada exitosamente');

        res.status(201).json({ mensaje: 'Usuario participante registrado exitosamente.' });

    } catch (error) {
        console.error('Error completo en /register:', error);
        await pool.query('ROLLBACK');
        console.log('Transacción revertida');
        res.status(500).json({ mensaje: 'Error en el servidor: ' + error.message });
    }
});

// Ruta POST /login (sin cambios, ya está correcta)
router.post('/login', async (req, res) => {
    const { nombre_usuario, password } = req.body;

    if (!nombre_usuario || !password) {
        return res.status(400).json({ mensaje: 'Faltan campos' });
    }

    try {
        const result = await pool.query(
            `SELECT u.id, u.nombre_usuario, u.password_hash, u.rol_id, r.nombre AS rol, u.empresa_id
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

        console.log('Login exitoso para usuario:', usuario.nombre_usuario, 'empresa_id:', usuario.empresa_id);

        // Guardar datos en la sesión
        req.session.usuario = {
            id: usuario.id,
            nombre: usuario.nombre_usuario,
            rol: usuario.rol,
            empresaId: usuario.empresa_id
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

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ mensaje: 'Error al cerrar la sesión.' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ mensaje: 'Sesión cerrada exitosamente.' });
  });
});

module.exports = router;
