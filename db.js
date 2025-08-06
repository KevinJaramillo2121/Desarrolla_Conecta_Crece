// db.js
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'convocatoria_db',
    password: 'postgresql',
    port: 5432,
});


module.exports = pool;
