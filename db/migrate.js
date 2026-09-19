const fs = require('fs');
const path = require('path');

async function migrate(pool) {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}

module.exports = { migrate };
