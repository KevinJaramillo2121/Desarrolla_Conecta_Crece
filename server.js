const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

// --- 1. IMPORTACIÓN DE RUTAS ---
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const evaluadorRoutes = require('./routes/evaluador');
const participanteRoutes = require('./routes/participante');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 2. CONFIGURACIÓN DE LA BASE DE DATOS ---
// La configuración de la base de datos se ha movido a `db.js` para ser centralizada.
// Las rutas y otros módulos ahora importarán `pool` desde `db.js`.
// No es necesario tener la configuración del pool aquí.

// --- 3. MIDDLEWARES PRINCIPALES ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sirve los archivos estáticos (HTML, CSS, JS del cliente) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la sesión segura para producción
const isProduction = process.env.NODE_ENV === 'production';

// Confía en el primer proxy (necesario para que `secure: true` funcione en Render)
app.set('trust proxy', 1); 

app.use(session({
    // Usa una variable de entorno para el secreto de la sesión
    secret: process.env.SESSION_SECRET || 'tu_secreto_muy_seguro_por_defecto',
    resave: false,
    saveUninitialized: false,
    cookie: {
        // secure: true solo si estamos en producción (HTTPS)
        secure: isProduction,
        httpOnly: true,     // Previene acceso desde JavaScript del lado del cliente
        sameSite: 'lax'     // Protección contra ataques CSRF
    }
}));


// --- 4. RUTAS DE LA APLICACIÓN ---

// Ruta explícita para la página de bienvenida (index.html)
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
