const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname, { maxAge: '1h' }));

const demo = {
  restaurant: {
    name: 'SANAQ CAFE',
    slug: 'demo',
    subtitle: 'Современная кухня • Шымкент',
    phone: '87000000000',
    address: 'Демонстрационное заведение',
    service: 'Обслуживание 10%'
  },
  categories: ['Завтраки','Салаты','Супы','Горячее','Пицца','Десерты','Напитки'],
  dishes: [
    {category:'Завтраки',name:'Сырники',description:'Нежные сырники, сметана и ягодный соус',price:2200,emoji:'🥞',badge:'Хит'},
    {category:'Завтраки',name:'Шакшука',description:'Яйца, томаты, сладкий перец и зелень',price:2400,emoji:'🍳',badge:''},
    {category:'Салаты',name:'Цезарь с курицей',description:'Курица, романо, черри, пармезан и соус цезарь',price:2900,emoji:'🥗',badge:'Популярное'},
    {category:'Салаты',name:'Греческий',description:'Свежие овощи, фета, маслины и оливковое масло',price:2500,emoji:'🥒',badge:''},
    {category:'Супы',name:'Рамен с говядиной',description:'Насыщенный бульон, лапша, говядина и яйцо',price:3200,emoji:'🍜',badge:''},
    {category:'Горячее',name:'Стейк с овощами',description:'Говядина, овощи гриль и фирменный соус',price:5900,emoji:'🥩',badge:'Chef choice'},
    {category:'Горячее',name:'Курица терияки',description:'Куриное филе, рис, овощи и соус терияки',price:3400,emoji:'🍗',badge:''},
    {category:'Пицца',name:'Маргарита',description:'Томатный соус, моцарелла и базилик',price:3300,emoji:'🍕',badge:''},
    {category:'Пицца',name:'Пепперони',description:'Томатный соус, моцарелла и пепперони',price:3900,emoji:'🍕',badge:''},
    {category:'Десерты',name:'Чизкейк',description:'Классический сливочный чизкейк',price:2100,emoji:'🍰',badge:''},
    {category:'Напитки',name:'Лимонад маракуйя',description:'Маракуйя, лимон, мята и газированная вода',price:1600,emoji:'🍹',badge:''},
    {category:'Напитки',name:'Капучино',description:'Эспрессо и нежная молочная пена',price:1200,emoji:'☕',badge:''}
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
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS service TEXT DEFAULT '';
    ALTER TABLE dishes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '';
    ALTER TABLE dishes ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '';
  `);
  await seedDemo();
}

async function seedDemo() {
  const restaurantResult = await pool.query(`
    INSERT INTO restaurants(name,slug,subtitle,phone,address,service)
    VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name, subtitle=EXCLUDED.subtitle,
      address=CASE WHEN restaurants.address='' THEN EXCLUDED.address ELSE restaurants.address END,
      service=CASE WHEN restaurants.service='' THEN EXCLUDED.service ELSE restaurants.service END
    RETURNING id`, [demo.restaurant.name, demo.restaurant.slug, demo.restaurant.subtitle, demo.restaurant.phone, demo.restaurant.address, demo.restaurant.service]);
  const restaurantId = restaurantResult.rows[0].id;
  const categoryIds = {};
  for (let i = 0; i < demo.categories.length; i++) {
    const c = await pool.query(`INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,$3)
      ON CONFLICT(restaurant_id,name) DO UPDATE SET sort_order=EXCLUDED.sort_order RETURNING id`, [restaurantId, demo.categories[i], i]);
    categoryIds[demo.categories[i]] = c.rows[0].id;
  }
  for (let i = 0; i < demo.dishes.length; i++) {
    const d = demo.dishes[i];
    const exists = await pool.query('SELECT id FROM dishes WHERE restaurant_id=$1 AND name=$2 LIMIT 1', [restaurantId, d.name]);
    if (exists.rowCount) {
      await pool.query('UPDATE dishes SET category_id=$2,description=$3,price=$4,emoji=$5,badge=$6,sort_order=$7 WHERE id=$1', [exists.rows[0].id, categoryIds[d.category], d.description, d.price, d.emoji, d.badge, i]);
    } else {
      await pool.query('INSERT INTO dishes(restaurant_id,category_id,name,description,price,emoji,badge,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [restaurantId, categoryIds[d.category], d.name, d.description, d.price, d.emoji, d.badge, i]);
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

app.get('/health', async (_req, res) => {
  let database = 'not-configured';
  if (pool) {
    try { await pool.query('SELECT 1'); database = 'connected'; }
    catch (_err) { database = 'error'; }
  }
  res.json({ ok: true, service: 'qr-menu', database, adminConfigured: Boolean(ADMIN_PASSWORD) });
});

app.get('/api/menu/:slug', async (req, res) => {
  try {
    if (!pool) {
      if (req.params.slug !== 'demo') return res.status(404).json({ error: 'Restaurant not found' });
      return res.json(demo);
    }
    const r = await pool.query('SELECT id,name,slug,subtitle,phone,address,service FROM restaurants WHERE slug=$1 AND active=TRUE', [req.params.slug]);
    if (!r.rowCount) return res.status(404).json({ error: 'Restaurant not found' });
    const restaurant = r.rows[0];
    const categories = await pool.query('SELECT id,name FROM categories WHERE restaurant_id=$1 ORDER BY sort_order,id', [restaurant.id]);
    const dishes = await pool.query('SELECT d.id,d.name,d.description,d.price,d.image_url,d.emoji,d.badge,c.name AS category FROM dishes d LEFT JOIN categories c ON c.id=d.category_id WHERE d.restaurant_id=$1 AND d.active=TRUE ORDER BY d.sort_order,d.id', [restaurant.id]);
    res.json({ restaurant, categories: categories.rows.map(c => c.name), dishes: dishes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/restaurants/:slug/qr', async (req, res) => {
  try {
    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${base.replace(/\/$/, '')}/r/${encodeURIComponent(req.params.slug)}`;
    const png = await QRCode.toBuffer(url, { width: 900, margin: 2, errorCorrectionLevel: 'H' });
    res.set('Cache-Control', 'public, max-age=3600');
    res.type('png').send(png);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'QR generation failed' });
  }
});

app.get('/api/admin/restaurants', adminAuth, async (_req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const result = await pool.query('SELECT id,name,slug,subtitle,phone,address,service,active FROM restaurants ORDER BY id');
  res.json(result.rows);
});

app.get('/api/admin/restaurants/:id/menu', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const restaurantResult = await pool.query('SELECT id,name,slug,subtitle,phone,address,service,active FROM restaurants WHERE id=$1', [req.params.id]);
  if (!restaurantResult.rowCount) return res.status(404).json({ error: 'Restaurant not found' });
  const categories = await pool.query('SELECT id,name,sort_order FROM categories WHERE restaurant_id=$1 ORDER BY sort_order,id', [req.params.id]);
  const dishes = await pool.query('SELECT id,category_id,name,description,price,image_url,emoji,badge,active,sort_order FROM dishes WHERE restaurant_id=$1 ORDER BY sort_order,id', [req.params.id]);
  res.json({ restaurant: restaurantResult.rows[0], categories: categories.rows, dishes: dishes.rows });
});

app.post('/api/admin/restaurants', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const { name, slug, subtitle = '', phone = '', address = '', service = '' } = req.body || {};
  if (!name || !slug || !/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'Invalid name or slug' });
  try {
    const result = await pool.query('INSERT INTO restaurants(name,slug,subtitle,phone,address,service) VALUES($1,$2,$3,$4,$5,$6) RETURNING *', [name, slug, subtitle, phone, address, service]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/restaurants/:id/categories', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  try {
    const result = await pool.query('INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM categories WHERE restaurant_id=$1)) RETURNING *', [req.params.id, name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Category already exists' });
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/restaurants/:id/dishes', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const { category_id, name, description = '', price, image_url = '', emoji = '', badge = '' } = req.body || {};
  if (!name || !Number.isInteger(Number(price)) || Number(price) < 0) return res.status(400).json({ error: 'Invalid dish data' });
  const result = await pool.query('INSERT INTO dishes(restaurant_id,category_id,name,description,price,image_url,emoji,badge,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM dishes WHERE restaurant_id=$1)) RETURNING *', [req.params.id, category_id || null, name, description, Number(price), image_url, emoji, badge]);
  res.status(201).json(result.rows[0]);
});

app.patch('/api/admin/dishes/:id', adminAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  const { name, description, price, image_url, emoji, badge, active, category_id } = req.body || {};
  const result = await pool.query('UPDATE dishes SET name=COALESCE($2,name),description=COALESCE($3,description),price=COALESCE($4,price),image_url=COALESCE($5,image_url),emoji=COALESCE($6,emoji),badge=COALESCE($7,badge),active=COALESCE($8,active),category_id=COALESCE($9,category_id) WHERE id=$1 RETURNING *', [req.params.id, name ?? null, description ?? null, price ?? null, image_url ?? null, emoji ?? null, badge ?? null, active ?? null, category_id ?? null]);
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
