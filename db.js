// db.js - VERSIÓN CORREGIDA Y MEJORADA
const { Pool } = require('pg');
require('dotenv').config(); // Carga variables de .env para el entorno local

// Detecta si estamos en producción (Render define NODE_ENV como 'production')
const isProduction = process.env.NODE_ENV === 'production';

// Usa la URL de la base de datos de Render si está en producción
const connectionString = process.env.DATABASE_URL;

// Define la configuración para la base de datos local
const localConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'convocatoria_db',
    password: 'postgresql',
    port: 5432,
};

// Crea la configuración del Pool de manera condicional
const poolConfig = {
    // Si estamos en producción, usa la connectionString de Render.
    // Si no, la propiedad connectionString será undefined y pg usará los otros campos.
    connectionString: isProduction ? connectionString : undefined,
    // El operador 'spread' (...) solo se aplicará si NO estamos en producción.
    ...(!isProduction && localConfig),
    // Habilita SSL solo en producción, que es un requisito de Render.
    ssl: isProduction ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

console.log(isProduction ? 'Conectando a la base de datos de Render...' : 'Conectando a la base de datos LOCAL...');

module.exports = pool;
