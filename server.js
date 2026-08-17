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
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname, { maxAge: '1h', etag: true }));

if (pool) pool.on('error', err => console.error('Postgres pool error:', err));

const photo = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=82`;
const demo = {
  restaurant: {
    name: 'SANAQ CAFE', slug: 'demo', subtitle: 'Современная кухня • Шымкент',
    phone: '', address: 'Шымкент', service: 'Обслуживание 10%'
  },
  categories: ['Завтраки','Салаты','Супы','Горячее','Пицца','Десерты','Напитки'],
  dishes: [
    ['Завтраки','Сырники','Нежные сырники, сметана и ягодный соус',2200,'Хит','photo-1528207776546-365bb710ee93'],
    ['Завтраки','Шакшука','Яйца, томаты, сладкий перец и зелень',2400,'','photo-1601050690597-df0568f70950'],
    ['Салаты','Цезарь с курицей','Курица, романо, черри, пармезан и соус цезарь',2900,'Популярное','photo-1546793665-c74683f339c1'],
    ['Салаты','Греческий','Свежие овощи, фета, маслины и оливковое масло',2500,'','photo-1540420773420-3366772f4999'],
    ['Супы','Рамен с говядиной','Насыщенный бульон, лапша, говядина и яйцо',3200,'','photo-1569718212165-3a8278d5f624'],
    ['Горячее','Стейк с овощами','Говядина, овощи гриль и фирменный соус',5900,'Выбор шефа','photo-1544025162-d76694265947'],
    ['Горячее','Курица терияки','Куриное филе, рис, овощи и соус терияки',3400,'','photo-1604908176997-125f25cc6f3d'],
    ['Пицца','Маргарита','Томатный соус, моцарелла и базилик',3300,'','photo-1574071318508-1cdbab80d002'],
    ['Пицца','Пепперони','Томатный соус, моцарелла и пепперони',3900,'','photo-1628840042765-356cda07504e'],
    ['Десерты','Чизкейк','Классический сливочный чизкейк',2100,'','photo-1524351199678-941a58a3df50'],
    ['Напитки','Лимонад маракуйя','Маракуйя, лимон, мята и газированная вода',1600,'','photo-1621263764928-df1444c5e859'],
    ['Напитки','Капучино','Эспрессо и нежная молочная пена',1200,'','photo-1509042239860-f550ce710b93']
  ].map((d, i) => ({category:d[0],name:d[1],description:d[2],price:d[3],badge:d[4],image_url:photo(d[5]),emoji:'',sort_order:i}))
};

const tr = {'а':'a','б':'b','в':'v','г':'g','ғ':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'i','к':'k','қ':'q','л':'l','м':'m','н':'n','ң':'n','о':'o','ө':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ұ':'u','ү':'u','ф':'f','х':'h','һ':'h','ц':'c','ч':'ch','ш':'sh','щ':'sh','ы':'y','і':'i','э':'e','ю':'yu','я':'ya','ь':'','ъ':''};
const slugify = v => String(v || '').trim().toLowerCase().split('').map(c => tr[c] ?? c).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

async function uniqueSlug(value) {
  const base = slugify(value) || 'menu';
  let slug = base, n = 2;
  while ((await pool.query('SELECT 1 FROM restaurants WHERE slug=$1', [slug])).rowCount) slug = `${base}-${n++}`;
  return slug;
}

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants(
      id SERIAL PRIMARY KEY,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,subtitle TEXT DEFAULT '',phone TEXT DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS categories(
      id SERIAL PRIMARY KEY,restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,UNIQUE(restaurant_id,name)
    );
    CREATE TABLE IF NOT EXISTS dishes(
      id SERIAL PRIMARY KEY,restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,name TEXT NOT NULL,description TEXT DEFAULT '',
      price INTEGER NOT NULL CHECK(price>=0),image_url TEXT DEFAULT '',active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS service TEXT DEFAULT '';
    ALTER TABLE dishes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '';
    ALTER TABLE dishes ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '';
  `);
  await seedDemo();
}

async function seedDemo() {
  const rr = await pool.query(`
    INSERT INTO restaurants(name,slug,subtitle,phone,address,service)
    VALUES($1,$2,$3,$4,$5,$6)
    ON CONFLICT(slug) DO UPDATE SET
      name=EXCLUDED.name, subtitle=EXCLUDED.subtitle, phone=EXCLUDED.phone,
      address=EXCLUDED.address, service=EXCLUDED.service, active=TRUE
    RETURNING id`, [demo.restaurant.name,'demo',demo.restaurant.subtitle,demo.restaurant.phone,demo.restaurant.address,demo.restaurant.service]);
  const rid = rr.rows[0].id;
  const ids = {};
  for (let i=0; i<demo.categories.length; i++) {
    const r = await pool.query(`INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,$3)
      ON CONFLICT(restaurant_id,name) DO UPDATE SET sort_order=EXCLUDED.sort_order RETURNING id`, [rid,demo.categories[i],i]);
    ids[demo.categories[i]] = r.rows[0].id;
  }
  for (const d of demo.dishes) {
    const e = await pool.query('SELECT id FROM dishes WHERE restaurant_id=$1 AND name=$2 LIMIT 1', [rid,d.name]);
    if (e.rowCount) {
      await pool.query(`UPDATE dishes SET category_id=$2,description=$3,price=$4,image_url=$5,emoji=$6,badge=$7,sort_order=$8,active=TRUE WHERE id=$1`,
        [e.rows[0].id,ids[d.category],d.description,d.price,d.image_url,d.emoji,d.badge,d.sort_order]);
    } else {
      await pool.query(`INSERT INTO dishes(restaurant_id,category_id,name,description,price,image_url,emoji,badge,sort_order)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [rid,ids[d.category],d.name,d.description,d.price,d.image_url,d.emoji,d.badge,d.sort_order]);
    }
  }
}

function auth(req, res, next) {
  if (!ADMIN_PASSWORD) return res.status(503).json({error:'ADMIN_PASSWORD is not configured'});
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return res.set('WWW-Authenticate','Basic realm="QR Menu Admin"').status(401).end();
  const p = Buffer.from(h.slice(6),'base64').toString().split(':').slice(1).join(':');
  const a = Buffer.from(p), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a,b)) return res.set('WWW-Authenticate','Basic realm="QR Menu Admin"').status(401).end();
  next();
}

function requireDb(_req, res, next) {
  if (!pool) return res.status(503).json({error:'DATABASE_URL is not configured'});
  next();
}

app.get('/health', async (_req,res) => {
  let database='not-configured';
  if (pool) try { await pool.query('SELECT 1'); database='connected'; } catch { database='error'; }
  res.set('Cache-Control','no-store').json({ok:true,service:'qr-menu',database,adminConfigured:Boolean(ADMIN_PASSWORD)});
});

app.get('/api/menu/:slug', async (req,res) => {
  try {
    res.set('Cache-Control','no-store');
    if (!pool) return req.params.slug==='demo' ? res.json(demo) : res.status(404).json({error:'Restaurant not found'});
    const r = await pool.query('SELECT id,name,slug,subtitle,phone,address,service FROM restaurants WHERE slug=$1 AND active=TRUE',[req.params.slug]);
    if (!r.rowCount) return res.status(404).json({error:'Restaurant not found'});
    const rid = r.rows[0].id;
    const [c,d] = await Promise.all([
      pool.query('SELECT id,name FROM categories WHERE restaurant_id=$1 ORDER BY sort_order,id',[rid]),
      pool.query('SELECT d.id,d.name,d.description,d.price,d.image_url,d.emoji,d.badge,c.name category FROM dishes d LEFT JOIN categories c ON c.id=d.category_id WHERE d.restaurant_id=$1 AND d.active=TRUE ORDER BY d.sort_order,d.id',[rid])
    ]);
    res.json({restaurant:r.rows[0],categories:c.rows.map(x=>x.name),dishes:d.rows});
  } catch (e) { console.error(e); res.status(500).json({error:'Server error'}); }
});

app.get('/api/restaurants/:slug/qr', async (req,res) => {
  try {
    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const target = `${base.replace(/\/$/,'')}/r/${encodeURIComponent(req.params.slug)}`;
    const png = await QRCode.toBuffer(target,{width:1000,margin:3,errorCorrectionLevel:'H'});
    res.set({'Cache-Control':'public, max-age=3600','Content-Disposition':`inline; filename="qr-${slugify(req.params.slug)||'menu'}.png"`});
    res.type('png').send(png);
  } catch (e) { console.error(e); res.status(500).json({error:'QR generation failed'}); }
});

app.get('/api/admin/restaurants', auth, requireDb, async (_req,res) => {
  res.json((await pool.query('SELECT id,name,slug,subtitle,phone,address,service,active FROM restaurants ORDER BY id')).rows);
});

app.get('/api/admin/restaurants/:id/menu', auth, requireDb, async (req,res) => {
  const r = await pool.query('SELECT id,name,slug,subtitle,phone,address,service,active FROM restaurants WHERE id=$1',[req.params.id]);
  if (!r.rowCount) return res.status(404).json({error:'Restaurant not found'});
  const [c,d] = await Promise.all([
    pool.query('SELECT id,name,sort_order FROM categories WHERE restaurant_id=$1 ORDER BY sort_order,id',[req.params.id]),
    pool.query('SELECT id,category_id,name,description,price,image_url,emoji,badge,active,sort_order FROM dishes WHERE restaurant_id=$1 ORDER BY sort_order,id',[req.params.id])
  ]);
  res.json({restaurant:r.rows[0],categories:c.rows,dishes:d.rows});
});

app.post('/api/admin/restaurants', auth, requireDb, async (req,res) => {
  const {name,slug,subtitle='',phone='',address='',service=''} = req.body || {};
  if (!String(name||'').trim()) return res.status(400).json({error:'Укажите название заведения'});
  const cleanSlug = slugify(slug || name);
  const finalSlug = cleanSlug && !(await pool.query('SELECT 1 FROM restaurants WHERE slug=$1',[cleanSlug])).rowCount ? cleanSlug : await uniqueSlug(cleanSlug || name);
  const result = await pool.query('INSERT INTO restaurants(name,slug,subtitle,phone,address,service) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
    [String(name).trim(),finalSlug,String(subtitle).trim(),String(phone).trim(),String(address).trim(),String(service).trim()]);
  res.status(201).json(result.rows[0]);
});

app.patch('/api/admin/restaurants/:id', auth, requireDb, async (req,res) => {
  const {name,subtitle,phone,address,service,active} = req.body || {};
  if (name !== undefined && !String(name).trim()) return res.status(400).json({error:'Укажите название заведения'});
  const r = await pool.query(`UPDATE restaurants SET name=COALESCE($2,name),subtitle=COALESCE($3,subtitle),phone=COALESCE($4,phone),
    address=COALESCE($5,address),service=COALESCE($6,service),active=COALESCE($7,active) WHERE id=$1 RETURNING *`,
    [req.params.id,name===undefined?null:String(name).trim(),subtitle??null,phone??null,address??null,service??null,active??null]);
  if (!r.rowCount) return res.status(404).json({error:'Restaurant not found'});
  res.json(r.rows[0]);
});

app.post('/api/admin/restaurants/:id/categories', auth, requireDb, async (req,res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({error:'Укажите категорию'});
  try {
    const r = await pool.query('INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM categories WHERE restaurant_id=$1)) RETURNING *',[req.params.id,name]);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code==='23505') return res.status(409).json({error:'Такая категория уже есть'});
    console.error(e); res.status(500).json({error:'Server error'});
  }
});

app.post('/api/admin/restaurants/:id/dishes', auth, requireDb, async (req,res) => {
  const {category_id,name,description='',price,image_url='',emoji='',badge=''} = req.body || {};
  if (!String(name||'').trim() || !Number.isInteger(Number(price)) || Number(price)<0) return res.status(400).json({error:'Проверьте название и цену'});
  const r = await pool.query(`INSERT INTO dishes(restaurant_id,category_id,name,description,price,image_url,emoji,badge,sort_order)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM dishes WHERE restaurant_id=$1)) RETURNING *`,
    [req.params.id,category_id||null,String(name).trim(),description,Number(price),image_url,emoji,badge]);
  res.status(201).json(r.rows[0]);
});

app.patch('/api/admin/dishes/:id', auth, requireDb, async (req,res) => {
  const {name,description,price,image_url,emoji,badge,active,category_id} = req.body || {};
  const r = await pool.query(`UPDATE dishes SET name=COALESCE($2,name),description=COALESCE($3,description),price=COALESCE($4,price),
    image_url=COALESCE($5,image_url),emoji=COALESCE($6,emoji),badge=COALESCE($7,badge),active=COALESCE($8,active),category_id=COALESCE($9,category_id)
    WHERE id=$1 RETURNING *`,[req.params.id,name??null,description??null,price??null,image_url??null,emoji??null,badge??null,active??null,category_id??null]);
  if (!r.rowCount) return res.status(404).json({error:'Dish not found'});
  res.json(r.rows[0]);
});

app.delete('/api/admin/dishes/:id', auth, requireDb, async (req,res) => {
  const r = await pool.query('DELETE FROM dishes WHERE id=$1 RETURNING id',[req.params.id]);
  if (!r.rowCount) return res.status(404).json({error:'Dish not found'});
  res.json({ok:true});
});

app.get('/r/:slug', (_req,res) => res.sendFile(path.join(__dirname,'index.html')));
app.get('/admin', auth, (_req,res) => res.sendFile(path.join(__dirname,'admin.html')));
app.get('/', (_req,res) => res.redirect('/r/demo'));

initDb().then(() => app.listen(PORT, () => console.log(`QR Menu запущено на порту ${PORT}`))).catch(e => {
  console.error('Database initialization failed:', e);
  process.exit(1);
});
