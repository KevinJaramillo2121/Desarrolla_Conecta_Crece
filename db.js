// db.js
const { Pool } = require('pg');
require('dotenv').config(); // Asegúrate de tener dotenv instalado: npm i dotenv

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Solo en producción se requiere SSL, Render lo gestiona automáticamente.
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
