const express = require('express');
const session = require('express-session');
const pg = require('pg');
const path = require('path');

// --- 1. IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const evaluadorRoutes = require('./routes/evaluador');
const participanteRoutes = require('./routes/participante');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 2. CONFIGURACIÓN DE LA BASE DE DATOS ---
const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'convocatoria_db',
    password: 'postgresql',
    port: 5432,
    // AÑADE ESTO PARA PRODUCCIÓN EN RENDER
    // ssl: {
    //   rejectUnauthorized: false
    // }
});

// --- 3. MIDDLEWARES PRINCIPALES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sirve los archivos estáticos (HTML, CSS, JS del cliente) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la sesión (debe ir antes de las rutas que la usan)
app.use(session({
    secret: 'tu_secreto_muy_seguro', // En producción, usa una variable de entorno
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Cambiar a true en producción si usas HTTPS
}));

// --- 4. RUTAS DE LA APLICACIÓN ---

// Ruta explícita para la página de bienvenida (index.html)
// Es buena práctica tenerla, aunque express.static podría servirla por defecto.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas de la API y de los diferentes roles
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/evaluador', evaluadorRoutes);
app.use('/participante', participanteRoutes);

// --- 5. MIDDLEWARE DE MANEJO DE ERRORES ---
// Este debe ser el ÚLTIMO middleware que se agrega.
app.use((err, req, res, next) => {
    console.error('Error no capturado:', err.stack);
    res.status(500).json({ mensaje: 'Ha ocurrido un error inesperado en el servidor.' });
});

// --- 6. INICIO DEL SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
