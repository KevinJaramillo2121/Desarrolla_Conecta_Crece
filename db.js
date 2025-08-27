const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
    // En producción, usa la URL de la base de datos de Render.
    // Localmente, usa los parámetros individuales.
    connectionString: isProduction ? process.env.DATABASE_URL : undefined,
    user: isProduction ? undefined : 'postgres',
    password: isProduction ? undefined : 'postgresql',
    host: isProduction ? undefined : 'localhost',
    database: isProduction ? undefined : 'convocatoria_db',
    port: isProduction ? undefined : 5432,
    // SSL es requerido por Render en producción.
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = pool;