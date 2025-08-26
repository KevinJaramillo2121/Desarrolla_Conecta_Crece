const express = require('express');
const session = require('express-session');
const pg = require('pg');
const path = require('path');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const evaluadorRoutes = require('./routes/evaluador');
const participanteRoutes = require('./routes/participante');

const app = express();
const PORT = 3000;

// Conexión a la base de datos
const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'convocatoria_db',
    password: 'postgresql',
    port: 5432,
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⚠️ Este middleware DEBE ir antes de cualquier ruta que use sesiones
app.use(session({
    secret: 'tu_secreto_muy_seguro',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Cambiar a true en producción con HTTPS
}));

// Archivos estáticos públicos (login, register)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas protegidas y públicas
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/evaluador', evaluadorRoutes);
app.use('/participante', participanteRoutes);

// Inicio del servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
// ✅ MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// Debe ser el último middleware que se agrega.
app.use((err, req, res, next) => {
    console.error('Error no capturado:', err.stack);
    res.status(500).json({ mensaje: 'Ha ocurrido un error inesperado en el servidor.' });
});
// Archivos estáticos públicos (login, register)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Ruta explícita para la página de bienvenida (index.html)
// Express sirve 'index.html' por defecto desde la carpeta estática,
// pero esta ruta lo hace más explícito y seguro.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// El resto de tu código de rutas y middlewares sigue igual...
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/evaluador', evaluadorRoutes);
app.use('/participante', participanteRoutes);
