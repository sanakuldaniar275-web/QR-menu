const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const demo = {
  restaurant: { name: 'Demo Cafe', slug: 'demo', subtitle: 'Добро пожаловать в наше меню' },
  categories: ['Завтраки', 'Салаты', 'Горячее', 'Пицца', 'Десерты', 'Напитки'],
  dishes: [
    { id: 1, category: 'Завтраки', name: 'Сырники', description: 'Со сметаной и ягодным соусом', price: 2200, image_url: '' },
    { id: 2, category: 'Завтраки', name: 'Омлет', description: 'Яйца, томаты, зелень и сыр', price: 1900, image_url: '' },
    { id: 3, category: 'Салаты', name: 'Цезарь с курицей', description: 'Курица, салат, томаты, соус', price: 2900, image_url: '' },
    { id: 4, category: 'Горячее', name: 'Стейк с овощами', description: 'Говядина и сезонные овощи', price: 5900, image_url: '' },
    { id: 5, category: 'Пицца', name: 'Маргарита', description: 'Томаты, моцарелла и базилик', price: 3300, image_url: '' },
    { id: 6, category: 'Десерты', name: 'Чизкейк', description: 'Классический сливочный десерт', price: 2100, image_url: '' },
    { id: 7, category: 'Напитки', name: 'Лимонад', description: 'Лимон, мята и газированная вода', price: 1400, image_url: '' }
  ]
};

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      subtitle TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE(restaurant_id, name)
    );
    CREATE TABLE IF NOT EXISTS dishes (
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price INTEGER NOT NULL CHECK(price >= 0),
      image_url TEXT DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const existing = await pool.query('SELECT id FROM restaurants WHERE slug=$1', ['demo']);
  if (!existing.rowCount) {
    const r = await pool.query('INSERT INTO restaurants(name, slug, subtitle) VALUES($1,$2,$3) RETURNING id', ['Demo Cafe', 'demo', 'Добро пожаловать в наше меню']);
    const restaurantId = r.rows[0].id;
    const categoryIds = {};
    for (let i = 0; i < demo.categories.length; i++) {
      const c = await pool.query('INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,$3) RETURNING id', [restaurantId, demo.categories[i], i]);
      categoryIds[demo.categories[i]] = c.rows[0].id;
    }
    for (let i = 0; i < demo.dishes.length; i++) {
      const d = demo.dishes[i];
      await pool.query('INSERT INTO dishes(restaurant_id,category_id,name,description,price,image_url,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7)', [restaurantId, categoryIds[d.category], d.name, d.description, d.price, d.image_url, i]);
    }
  }
}

function adminAuth(req, res, next) {
  if (!ADMIN_PASSWORD) return res.status(503).json({ error: 'ADMIN_PASSWORD is not configured' });
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return res.set('WWW-Authenticate', 'Basic realm="QR Menu Admin"').status(401).end();
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const password = decoded.split(':').slice(1).join(':');
  const a = Buffer.from(password);
  const b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.set('WWW-Authenticate', 'Basic realm="QR Menu Admin"').status(401).end();
  next();
}

app.get('/api/menu/:slug', async (req, res) => {
  try {
    if (!pool) {
      if (req.params.slug !== 'demo') return res.status(404).json({ error: 'Restaurant not found' });
      return res.json(demo);
    }
    const r = await pool.query('SELECT id,name,slug,subtitle,phone FROM restaurants WHERE slug=$1 AND active=TRUE', [req.params.slug]);
    if (!r.rowCount) return res.status(404).json({ error: 'Restaurant not found' });
    const restaurant = r.rows[0];
    const categories = await pool.query('SELECT id,name FROM categories WHERE restaurant_id=$1 ORDER BY sort_order,id', [restaurant.id]);
    const dishes = await pool.query(`SELECT d.id,d.name,d.description,d.price,d.image_url,c.name AS category FROM dishes d LEFT JOIN categories c ON c.id=d.category_id WHERE d.restaurant_id=$1 AND d.active=TRUE ORDER BY d.sort_order,d.id`, [restaurant.id]);
    res.json({ restaurant, categories: categories.rows.map(c => c.name), dishes: dishes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/restaurants/:slug/qr', async (req, res) => {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${base}/r/${encodeURIComponent(req.params.slug)}`;
  const png = await QRCode.toBuffer(url, { width: 700, margin: 2 });
  res.type('png').send(png);
});

app.get('/api/admin/restaurants', adminAuth, async (_req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const result = await pool.query('SELECT id,name,slug,subtitle,phone,active FROM restaurants ORDER BY id');
  res.json(result.rows);
});

app.post('/api/admin/restaurants', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const { name, slug, subtitle = '', phone = '' } = req.body || {};
  if (!name || !slug || !/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'Invalid name or slug' });
  try {
    const result = await pool.query('INSERT INTO restaurants(name,slug,subtitle,phone) VALUES($1,$2,$3,$4) RETURNING *', [name, slug, subtitle, phone]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    throw err;
  }
});

app.post('/api/admin/restaurants/:id/categories', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const result = await pool.query('INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM categories WHERE restaurant_id=$1)) RETURNING *', [req.params.id, name]);
  res.status(201).json(result.rows[0]);
});

app.post('/api/admin/restaurants/:id/dishes', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const { category_id, name, description = '', price, image_url = '' } = req.body || {};
  if (!name || !Number.isInteger(Number(price)) || Number(price) < 0) return res.status(400).json({ error: 'Invalid dish data' });
  const result = await pool.query('INSERT INTO dishes(restaurant_id,category_id,name,description,price,image_url,sort_order) VALUES($1,$2,$3,$4,$5,$6,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM dishes WHERE restaurant_id=$1)) RETURNING *', [req.params.id, category_id || null, name, description, Number(price), image_url]);
  res.status(201).json(result.rows[0]);
});

app.patch('/api/admin/dishes/:id', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const { name, description, price, image_url, active, category_id } = req.body || {};
  const result = await pool.query(`UPDATE dishes SET name=COALESCE($2,name),description=COALESCE($3,description),price=COALESCE($4,price),image_url=COALESCE($5,image_url),active=COALESCE($6,active),category_id=COALESCE($7,category_id) WHERE id=$1 RETURNING *`, [req.params.id, name ?? null, description ?? null, price ?? null, image_url ?? null, active ?? null, category_id ?? null]);
  if (!result.rowCount) return res.status(404).json({ error: 'Dish not found' });
  res.json(result.rows[0]);
});

app.get('/r/:slug', (_req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', adminAuth, (_req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/', (_req, res) => res.redirect('/r/demo'));

initDb().then(() => {
  app.listen(PORT, () => console.log(`QR Menu запущено на порту ${PORT}`));
}).catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});
