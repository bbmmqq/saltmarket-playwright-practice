const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://saltmarket:saltmarket@localhost:5432/saltmarket',
});

module.exports = pool;
