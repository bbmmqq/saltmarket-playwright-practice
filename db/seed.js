const bcrypt = require('bcryptjs');
const { seedProducts, seedUsers } = require('../data');

async function insertSeedData(pool) {
  for (const p of seedProducts()) {
    await pool.query(
      `INSERT INTO products (id, name, category, price, stock, unit, emoji, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p.id, p.name, p.category, p.price, p.stock, p.unit, p.emoji, p.description]
    );
  }
  await pool.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`);

  for (const u of seedUsers()) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash) VALUES ($1,$2,$3,$4)`,
      [u.id, u.name, u.email, hash]
    );
  }
  await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`);

  await pool.query(`ALTER SEQUENCE orders_id_seq RESTART WITH 1001`);
}

async function seedIfEmpty(pool) {
  const { rows } = await pool.query('SELECT COUNT(*) FROM products');
  if (Number(rows[0].count) > 0) return;
  await insertSeedData(pool);
}

async function resetDatabase(pool) {
  await pool.query(
    'TRUNCATE cart_items, cart_coupons, order_items, orders, users, products RESTART IDENTITY CASCADE'
  );
  await insertSeedData(pool);
}

module.exports = { seedIfEmpty, resetDatabase };
