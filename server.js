const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const pool = require('./db/pool');
const { migrate } = require('./db/migrate');
const { seedIfEmpty, resetDatabase } = require('./db/seed');
const { COUPONS } = require('./data');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  let sid = req.cookies.sid;
  if (!sid) {
    sid = crypto.randomUUID();
    res.cookie('sid', sid, { httpOnly: true, sameSite: 'lax' });
  }
  req.sid = sid;
  next();
});

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function currentUser(req) {
  const uid = Number(req.cookies.uid);
  if (!uid) return null;
  const { rows } = await pool.query('SELECT id, name, email, is_admin FROM users WHERE id = $1', [uid]);
  if (!rows[0]) return null;
  return { id: rows[0].id, name: rows[0].name, email: rows[0].email, isAdmin: rows[0].is_admin };
}

async function requireAdmin(req, res, next) {
  try {
    const user = await currentUser(req);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function getCoupon(sid) {
  const { rows } = await pool.query('SELECT coupon FROM cart_coupons WHERE sid = $1', [sid]);
  return rows[0]?.coupon || null;
}

async function buildCartResponse(sid) {
  const { rows } = await pool.query(
    `SELECT ci.product_id, ci.quantity, p.name, p.price, p.emoji, p.unit, p.stock
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.sid = $1
     ORDER BY ci.product_id`,
    [sid]
  );

  const coupon = await getCoupon(sid);

  const items = rows.map((r) => ({
    productId: r.product_id,
    quantity: r.quantity,
    name: r.name,
    price: Number(r.price),
    emoji: r.emoji,
    unit: r.unit,
    lineTotal: round2(Number(r.price) * r.quantity),
    stock: r.stock,
  }));

  const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));
  const discountRate = coupon ? COUPONS[coupon] || 0 : 0;
  const discount = round2(subtotal * discountRate);
  const shipping = items.length === 0 ? 0 : subtotal - discount >= 50 ? 0 : 5.99;
  const tax = round2((subtotal - discount) * 0.08);
  const total = round2(subtotal - discount + shipping + tax);

  return {
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    coupon,
    discountRate,
    subtotal,
    discount,
    shipping,
    tax,
    total,
  };
}

// ---- Test utility ----
app.post('/api/reset', async (req, res, next) => {
  try {
    await resetDatabase(pool);
    res.clearCookie('uid');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---- Catalog ----
app.get('/api/categories', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json(rows.map((r) => r.category));
  } catch (err) {
    next(err);
  }
});

app.get('/api/products', async (req, res, next) => {
  try {
    const { search, category, sort, page = '1', pageSize = '8' } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    if (category) {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderClause = 'ORDER BY id';
    if (sort === 'price-asc') orderClause = 'ORDER BY price ASC';
    if (sort === 'price-desc') orderClause = 'ORDER BY price DESC';
    if (sort === 'name-asc') orderClause = 'ORDER BY name ASC';

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.max(1, parseInt(pageSize, 10) || 8);
    const offset = (pageNum - 1) * size;

    const countRes = await pool.query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
    const total = Number(countRes.rows[0].count);

    const itemsParams = [...params, size, offset];
    const itemsRes = await pool.query(
      `SELECT * FROM products ${whereClause} ${orderClause} LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length}`,
      itemsParams
    );

    res.json({
      items: itemsRes.rows.map(toProductJson),
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.max(1, Math.ceil(total / size)),
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/products/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json(toProductJson(rows[0]));
  } catch (err) {
    next(err);
  }
});

function toProductJson(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    unit: row.unit,
    emoji: row.emoji,
    description: row.description,
  };
}

// ---- Cart ----
app.get('/api/cart', async (req, res, next) => {
  try {
    res.json(await buildCartResponse(req.sid));
  } catch (err) {
    next(err);
  }
});

app.post('/api/cart', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    const product = rows[0];
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existing = await pool.query(
      'SELECT quantity FROM cart_items WHERE sid = $1 AND product_id = $2',
      [req.sid, product.id]
    );
    const currentQty = existing.rows[0]?.quantity || 0;
    const newQty = currentQty + Number(quantity);

    if (newQty > product.stock) {
      return res.status(400).json({ error: `Only ${product.stock} left in stock` });
    }
    if (newQty <= 0) {
      await pool.query('DELETE FROM cart_items WHERE sid = $1 AND product_id = $2', [req.sid, product.id]);
    } else {
      await pool.query(
        `INSERT INTO cart_items (sid, product_id, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (sid, product_id) DO UPDATE SET quantity = $3`,
        [req.sid, product.id, newQty]
      );
    }
    res.status(201).json(await buildCartResponse(req.sid));
  } catch (err) {
    next(err);
  }
});

app.patch('/api/cart/:productId', async (req, res, next) => {
  try {
    const productId = Number(req.params.productId);
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
    const product = rows[0];
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const quantity = Number(req.body.quantity);
    if (quantity > product.stock) {
      return res.status(400).json({ error: `Only ${product.stock} left in stock` });
    }
    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE sid = $1 AND product_id = $2', [req.sid, productId]);
    } else {
      await pool.query(
        `INSERT INTO cart_items (sid, product_id, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (sid, product_id) DO UPDATE SET quantity = $3`,
        [req.sid, productId, quantity]
      );
    }
    res.json(await buildCartResponse(req.sid));
  } catch (err) {
    next(err);
  }
});

app.delete('/api/cart/:productId', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE sid = $1 AND product_id = $2', [
      req.sid,
      req.params.productId,
    ]);
    res.json(await buildCartResponse(req.sid));
  } catch (err) {
    next(err);
  }
});

app.post('/api/cart/coupon', async (req, res, next) => {
  try {
    const code = String(req.body.code || '').trim().toUpperCase();
    if (!COUPONS[code]) {
      return res.status(400).json({ error: 'Invalid coupon code' });
    }
    await pool.query(
      `INSERT INTO cart_coupons (sid, coupon) VALUES ($1, $2)
       ON CONFLICT (sid) DO UPDATE SET coupon = $2`,
      [req.sid, code]
    );
    res.json(await buildCartResponse(req.sid));
  } catch (err) {
    next(err);
  }
});

app.delete('/api/cart/coupon', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_coupons WHERE sid = $1', [req.sid]);
    res.json(await buildCartResponse(req.sid));
  } catch (err) {
    next(err);
  }
});

// ---- Auth ----
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
    if (existing.rows.length) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, is_admin',
      [name, email, hash]
    );
    const user = rows[0];
    res.cookie('uid', String(user.id), { httpOnly: true, sameSite: 'lax' });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, isAdmin: user.is_admin });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [
      email || '',
    ]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.cookie('uid', String(user.id), { httpOnly: true, sameSite: 'lax' });
    res.json({ id: user.id, name: user.name, email: user.email, isAdmin: user.is_admin });
  } catch (err) {
    next(err);
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('uid');
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res, next) => {
  try {
    res.json(await currentUser(req));
  } catch (err) {
    next(err);
  }
});

// ---- Admin ----
app.get('/api/admin/products', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows.map(toProductJson));
  } catch (err) {
    next(err);
  }
});

function validateProductInput(body, { partial } = { partial: false }) {
  const fields = ['name', 'category', 'price', 'stock', 'unit', 'emoji', 'description'];
  for (const field of fields) {
    if (!partial && (body[field] === undefined || body[field] === null || body[field] === '')) {
      return `${field} is required`;
    }
  }
  if (body.price !== undefined && Number(body.price) < 0) return 'Price must be zero or positive';
  if (body.stock !== undefined && Number(body.stock) < 0) return 'Stock must be zero or positive';
  return null;
}

app.post('/api/admin/products', requireAdmin, async (req, res, next) => {
  try {
    const error = validateProductInput(req.body);
    if (error) return res.status(400).json({ error });

    const { name, category, price, stock, unit, emoji, description } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO products (name, category, price, stock, unit, emoji, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, category, price, stock, unit, emoji, description]
    );
    res.status(201).json(toProductJson(rows[0]));
  } catch (err) {
    next(err);
  }
});

app.patch('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const error = validateProductInput(req.body, { partial: true });
    if (error) return res.status(400).json({ error });

    const { rows: existingRows } = await pool.query('SELECT * FROM products WHERE id = $1', [
      req.params.id,
    ]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const fields = ['name', 'category', 'price', 'stock', 'unit', 'emoji', 'description'];
    const merged = {};
    for (const f of fields) {
      merged[f] = req.body[f] !== undefined ? req.body[f] : existing[f];
    }

    const { rows } = await pool.query(
      `UPDATE products SET name=$1, category=$2, price=$3, stock=$4, unit=$5, emoji=$6, description=$7
       WHERE id = $8 RETURNING *`,
      [merged.name, merged.category, merged.price, merged.stock, merged.unit, merged.emoji, merged.description, req.params.id]
    );
    res.json(toProductJson(rows[0]));
  } catch (err) {
    next(err);
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(204).end();
  } catch (err) {
    if (err.code === '23503') {
      return res
        .status(400)
        .json({ error: 'Cannot delete a product that appears in existing orders' });
    }
    next(err);
  }
});

// ---- Checkout ----
app.post('/api/checkout', async (req, res, next) => {
  try {
    const cart = await buildCartResponse(req.sid);
    if (cart.items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    const { shipping = {}, payment = {} } = req.body;
    const requiredShipping = ['fullName', 'address', 'city', 'postalCode', 'country', 'email'];
    for (const field of requiredShipping) {
      if (!shipping[field] || !String(shipping[field]).trim()) {
        return res.status(400).json({ error: `${field} is required`, field: `shipping.${field}` });
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(shipping.email)) {
      return res.status(400).json({ error: 'Enter a valid email address', field: 'shipping.email' });
    }

    const cardDigits = String(payment.cardNumber || '').replace(/\s/g, '');
    if (!/^\d{16}$/.test(cardDigits)) {
      return res.status(400).json({ error: 'Card number must be 16 digits', field: 'payment.cardNumber' });
    }
    if (!/^\d{2}\/\d{2}$/.test(String(payment.expiry || ''))) {
      return res.status(400).json({ error: 'Expiry must be in MM/YY format', field: 'payment.expiry' });
    }
    if (!/^\d{3,4}$/.test(String(payment.cvc || ''))) {
      return res.status(400).json({ error: 'CVC must be 3 or 4 digits', field: 'payment.cvc' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of cart.items) {
        const { rows } = await client.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [
          item.productId,
        ]);
        if (!rows[0] || item.quantity > rows[0].stock) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `${item.name} no longer has enough stock` });
        }
      }

      for (const item of cart.items) {
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [
          item.quantity,
          item.productId,
        ]);
      }

      const orderRes = await client.query(
        `INSERT INTO orders
           (sid, full_name, email, address, city, postal_code, country,
            subtotal, discount, coupon, shipping_cost, tax, total, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'confirmed')
         RETURNING id, created_at`,
        [
          req.sid,
          shipping.fullName,
          shipping.email,
          shipping.address,
          shipping.city,
          shipping.postalCode,
          shipping.country,
          cart.subtotal,
          cart.discount,
          cart.coupon,
          cart.shipping,
          cart.tax,
          cart.total,
        ]
      );
      const orderId = orderRes.rows[0].id;

      for (const item of cart.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, price, quantity, line_total)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, item.productId, item.name, item.price, item.quantity, item.lineTotal]
        );
      }

      await client.query('DELETE FROM cart_items WHERE sid = $1', [req.sid]);
      await client.query('DELETE FROM cart_coupons WHERE sid = $1', [req.sid]);

      await client.query('COMMIT');

      res.status(201).json({
        id: orderId,
        items: cart.items,
        subtotal: cart.subtotal,
        discount: cart.discount,
        coupon: cart.coupon,
        shippingCost: cart.shipping,
        tax: cart.tax,
        total: cart.total,
        shipping,
        createdAt: orderRes.rows[0].created_at,
        status: 'confirmed',
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

app.get('/api/orders/:id', async (req, res, next) => {
  try {
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    const order = orderRes.rows[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const itemsRes = await pool.query(
      'SELECT product_id, name, price, quantity, line_total FROM order_items WHERE order_id = $1 ORDER BY id',
      [order.id]
    );

    res.json({
      id: order.id,
      items: itemsRes.rows.map((i) => ({
        productId: i.product_id,
        name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
        lineTotal: Number(i.line_total),
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      coupon: order.coupon,
      shippingCost: Number(order.shipping_cost),
      tax: Number(order.tax),
      total: Number(order.total),
      shipping: {
        fullName: order.full_name,
        email: order.email,
        address: order.address,
        city: order.city,
        postalCode: order.postal_code,
        country: order.country,
      },
      createdAt: order.created_at,
      status: order.status,
    });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function waitForDb(retries = 20, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      console.log(`Waiting for database... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(
    'Could not connect to the database after multiple retries. Run `npm run db:up` to start Postgres first.'
  );
}

const PORT = process.env.PORT || 3000;

async function start() {
  await waitForDb();
  await migrate(pool);
  await seedIfEmpty(pool);
  app.listen(PORT, () => {
    console.log(`SaltMarket running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
