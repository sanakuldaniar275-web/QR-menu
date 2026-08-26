const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const { Pool } = require('pg');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : null;
const SESSION_KEY = crypto.createHash('sha256').update(process.env.CLIENT_SESSION_SECRET || `${ADMIN_PASSWORD}:qrmenu-client-session`).digest();

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname,{maxAge:'1h',etag:true,setHeaders(res,filePath){if(/admin(?:-[^/]+)?\.(?:js|css|html)$/.test(filePath))res.set('Cache-Control','no-store')}}));
if (pool) pool.on('error', err => console.error('Postgres pool error:', err));

const photo = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=82`;
const demo = {
  restaurant: {name:'SANAQ CAFE',slug:'demo',subtitle:'Современная кухня • Шымкент',phone:'',address:'Шымкент',service:'Обслуживание 10%',logo_url:'',hero_image_url:'',accent_color:'#f3d21b',theme:'light'},
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
  ].map((d,i)=>({category:d[0],name:d[1],description:d[2],price:d[3],variants:[],badge:d[4],image_url:photo(d[5]),emoji:'',sort_order:i}))
};

const tr={'а':'a','б':'b','в':'v','г':'g','ғ':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'i','к':'k','қ':'q','л':'l','м':'m','н':'n','ң':'n','о':'o','ө':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ұ':'u','ү':'u','ф':'f','х':'h','һ':'h','ц':'c','ч':'ch','ш':'sh','щ':'sh','ы':'y','і':'i','э':'e','ю':'yu','я':'ya','ь':'','ъ':''};
const slugify=v=>String(v||'').trim().toLowerCase().split('').map(c=>tr[c]??c).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70);
const safeColor=v=>/^#[0-9a-f]{6}$/i.test(String(v||''))?String(v):null;
const safeTheme=v=>['light','dark','warm'].includes(v)?v:null;
function normalizeVariants(value){
  if(value===undefined)return undefined;
  let raw=value;
  if(typeof raw==='string'){
    if(!raw.trim()) return [];
    try{raw=JSON.parse(raw);}catch{return null;}
  }
  if(!Array.isArray(raw)||raw.length>20)return null;
  const out=[];
  for(const item of raw){
    const name=String(item?.name||'').trim().slice(0,80), price=Number(item?.price);
    if(!name||!Number.isInteger(price)||price<0)return null;
    out.push({name,price});
  }
  return out;
}
function resolvedPrice(price,variants,existingPrice=null){
  if(price!==undefined&&price!==null&&price!==''){
    const n=Number(price); if(Number.isInteger(n)&&n>=0)return n; return null;
  }
  if(Array.isArray(variants)&&variants.length)return Math.min(...variants.map(v=>v.price));
  if(existingPrice!==null)return Number(existingPrice);
  return null;
}

async function uniqueSlug(value){const base=slugify(value)||'menu';let slug=base,n=2;while((await pool.query('SELECT 1 FROM restaurants WHERE slug=$1',[slug])).rowCount)slug=`${base}-${n++}`;return slug;}
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){return {salt,hash:crypto.scryptSync(String(password),salt,64).toString('hex')}};
function verifyPassword(password,salt,hash){try{const a=crypto.scryptSync(String(password),salt,64),b=Buffer.from(hash,'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b);}catch{return false;}}
function parseCookies(req){return Object.fromEntries(String(req.headers.cookie||'').split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),decodeURIComponent(x.slice(i+1))]}));}
function signSession(id){const payload=Buffer.from(JSON.stringify({id,exp:Date.now()+1000*60*60*24*14})).toString('base64url');const sig=crypto.createHmac('sha256',SESSION_KEY).update(payload).digest('base64url');return `${payload}.${sig}`;}
function verifySession(token){try{const [payload,sig]=String(token||'').split('.');const expected=crypto.createHmac('sha256',SESSION_KEY).update(payload).digest('base64url');if(!sig||sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;const data=JSON.parse(Buffer.from(payload,'base64url').toString());return data.exp>Date.now()?data:null;}catch{return null;}}

async function initDb(){
  if(!pool)return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS restaurants(id SERIAL PRIMARY KEY,name TEXT NOT NULL,slug TEXT UNIQUE NOT NULL,subtitle TEXT DEFAULT '',phone TEXT DEFAULT '',active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS categories(id SERIAL PRIMARY KEY,restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,name TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0,UNIQUE(restaurant_id,name));
    CREATE TABLE IF NOT EXISTS dishes(id SERIAL PRIMARY KEY,restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,name TEXT NOT NULL,description TEXT DEFAULT '',price INTEGER NOT NULL CHECK(price>=0),image_url TEXT DEFAULT '',active BOOLEAN NOT NULL DEFAULT TRUE,sort_order INTEGER NOT NULL DEFAULT 0,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS service TEXT DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS hero_image_url TEXT DEFAULT '';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#f3d21b';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#f5f4ef';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS card_style TEXT DEFAULT 'soft';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS corner_radius INTEGER DEFAULT 20;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'modern';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS hero_height INTEGER DEFAULT 320;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS hero_overlay INTEGER DEFAULT 55;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS category_style TEXT DEFAULT 'pills';
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS card_columns INTEGER DEFAULT 2;
    ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS design_settings JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE dishes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '';
    ALTER TABLE dishes ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT '';
    ALTER TABLE dishes ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;
    CREATE TABLE IF NOT EXISTS client_accounts(
      id SERIAL PRIMARY KEY,
      restaurant_id INTEGER UNIQUE NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await seedDemo();
  await pool.query("DELETE FROM restaurants WHERE slug='shokantre-kafe' AND name='NurislamBar'");
}

async function seedDemo(){
  const rr=await pool.query(`INSERT INTO restaurants(name,slug,subtitle,phone,address,service,accent_color,theme) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT(slug) DO UPDATE SET name=EXCLUDED.name,subtitle=EXCLUDED.subtitle,phone=EXCLUDED.phone,address=EXCLUDED.address,service=EXCLUDED.service,active=TRUE RETURNING id`,
    [demo.restaurant.name,'demo',demo.restaurant.subtitle,demo.restaurant.phone,demo.restaurant.address,demo.restaurant.service,demo.restaurant.accent_color,demo.restaurant.theme]);
  const rid=rr.rows[0].id,ids={};
  for(let i=0;i<demo.categories.length;i++){const r=await pool.query(`INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,$3) ON CONFLICT(restaurant_id,name) DO UPDATE SET sort_order=EXCLUDED.sort_order RETURNING id`,[rid,demo.categories[i],i]);ids[demo.categories[i]]=r.rows[0].id;}
  for(const d of demo.dishes){const e=await pool.query('SELECT id FROM dishes WHERE restaurant_id=$1 AND name=$2 LIMIT 1',[rid,d.name]);if(e.rowCount)await pool.query(`UPDATE dishes SET category_id=$2,description=$3,price=$4,image_url=$5,emoji=$6,badge=$7,sort_order=$8,active=TRUE WHERE id=$1`,[e.rows[0].id,ids[d.category],d.description,d.price,d.image_url,d.emoji,d.badge,d.sort_order]);else await pool.query(`INSERT INTO dishes(restaurant_id,category_id,name,description,price,image_url,emoji,badge,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[rid,ids[d.category],d.name,d.description,d.price,d.image_url,d.emoji,d.badge,d.sort_order]);}
}

function auth(req,res,next){if(!ADMIN_PASSWORD)return res.status(503).json({error:'ADMIN_PASSWORD is not configured'});const h=req.headers.authorization||'';if(!h.startsWith('Basic '))return res.set('WWW-Authenticate','Basic realm="QR Menu Admin"').status(401).end();const p=Buffer.from(h.slice(6),'base64').toString().split(':').slice(1).join(':'),a=Buffer.from(p),b=Buffer.from(ADMIN_PASSWORD);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.set('WWW-Authenticate','Basic realm="QR Menu Admin"').status(401).end();next();}
function requireDb(_req,res,next){if(!pool)return res.status(503).json({error:'DATABASE_URL is not configured'});next();}
async function clientAuth(req,res,next){const data=verifySession(parseCookies(req).qr_client);if(!data)return res.status(401).json({error:'Требуется вход'});const r=await pool.query(`SELECT ca.id account_id,ca.username,ca.restaurant_id,r.name,r.slug,r.active FROM client_accounts ca JOIN restaurants r ON r.id=ca.restaurant_id WHERE ca.id=$1 AND ca.enabled=TRUE AND r.active=TRUE`,[data.id]);if(!r.rowCount)return res.status(401).json({error:'Доступ отключён'});req.client=r.rows[0];next();}
const restaurantFields='id,name,slug,subtitle,phone,address,service,logo_url,hero_image_url,accent_color,theme,background_color,card_style,corner_radius,font_style,hero_height,hero_overlay,category_style,card_columns,design_settings,active';
async function menuPayload(rid){const [r,c,d]=await Promise.all([pool.query(`SELECT ${restaurantFields} FROM restaurants WHERE id=$1`,[rid]),pool.query('SELECT id,name,sort_order FROM categories WHERE restaurant_id=$1 ORDER BY sort_order,id',[rid]),pool.query('SELECT id,category_id,name,description,price,variants,image_url,emoji,badge,active,sort_order FROM dishes WHERE restaurant_id=$1 ORDER BY sort_order,id',[rid])]);return {restaurant:r.rows[0],categories:c.rows,dishes:d.rows};}

app.get('/health',async(_req,res)=>{let database='not-configured';if(pool)try{await pool.query('SELECT 1');database='connected';}catch{database='error';}res.set('Cache-Control','no-store').json({ok:true,service:'qr-menu',database,adminConfigured:Boolean(ADMIN_PASSWORD),clientPortal:true,dishVariants:true});});
app.get('/api/menu/:slug',async(req,res)=>{try{res.set('Cache-Control','no-store');if(!pool)return req.params.slug==='demo'?res.json(demo):res.status(404).json({error:'Restaurant not found'});const r=await pool.query(`SELECT ${restaurantFields} FROM restaurants WHERE slug=$1 AND active=TRUE`,[req.params.slug]);if(!r.rowCount)return res.status(404).json({error:'Restaurant not found'});const rid=r.rows[0].id,[c,d]=await Promise.all([pool.query('SELECT name FROM categories WHERE restaurant_id=$1 ORDER BY sort_order,id',[rid]),pool.query('SELECT d.id,d.name,d.description,d.price,d.variants,d.image_url,d.emoji,d.badge,c.name category FROM dishes d LEFT JOIN categories c ON c.id=d.category_id WHERE d.restaurant_id=$1 AND d.active=TRUE ORDER BY d.sort_order,d.id',[rid])]);res.json({restaurant:r.rows[0],categories:c.rows.map(x=>x.name),dishes:d.rows});}catch(e){console.error(e);res.status(500).json({error:'Server error'});}});
app.get('/api/restaurants/:slug/qr',async(req,res)=>{try{const base=process.env.PUBLIC_BASE_URL||`${req.protocol}://${req.get('host')}`,target=`${base.replace(/\/$/,'')}/r/${encodeURIComponent(req.params.slug)}`,png=await QRCode.toBuffer(target,{width:1000,margin:3,errorCorrectionLevel:'H'});res.set({'Cache-Control':'public, max-age=3600','Content-Disposition':`inline; filename="qr-${slugify(req.params.slug)||'menu'}.png"`});res.type('png').send(png);}catch(e){console.error(e);res.status(500).json({error:'QR generation failed'});}});

app.get('/api/admin/restaurants',auth,requireDb,async(_req,res)=>{const q=await pool.query(`SELECT r.${restaurantFields.replaceAll(',',',r.')},ca.username client_username,COALESCE(ca.enabled,FALSE) client_enabled FROM restaurants r LEFT JOIN client_accounts ca ON ca.restaurant_id=r.id ORDER BY r.id`);res.json(q.rows);});
app.get('/api/admin/restaurants/:id/menu',auth,requireDb,async(req,res)=>{const data=await menuPayload(req.params.id);if(!data.restaurant)return res.status(404).json({error:'Restaurant not found'});const a=await pool.query('SELECT username,enabled FROM client_accounts WHERE restaurant_id=$1',[req.params.id]);data.clientAccess=a.rows[0]||null;res.json(data);});
app.post('/api/admin/restaurants',auth,requireDb,async(req,res)=>{const {name,slug,subtitle='',phone='',address='',service=''}=req.body||{};if(!String(name||'').trim())return res.status(400).json({error:'Укажите название заведения'});const clean=slugify(slug||name),finalSlug=clean&&!(await pool.query('SELECT 1 FROM restaurants WHERE slug=$1',[clean])).rowCount?clean:await uniqueSlug(clean||name);const r=await pool.query('INSERT INTO restaurants(name,slug,subtitle,phone,address,service) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[String(name).trim(),finalSlug,String(subtitle).trim(),String(phone).trim(),String(address).trim(),String(service).trim()]);res.status(201).json(r.rows[0]);});
app.patch('/api/admin/restaurants/:id',auth,requireDb,async(req,res)=>{const {name,subtitle,phone,address,service,active,logo_url,hero_image_url,accent_color,theme,background_color,card_style,corner_radius,font_style,hero_height,hero_overlay,category_style,card_columns,design_settings}=req.body||{},settings=design_settings===undefined?null:(typeof design_settings==='string'?JSON.parse(design_settings||'{}'):design_settings);if(name!==undefined&&!String(name).trim())return res.status(400).json({error:'Укажите название заведения'});if(accent_color!==undefined&&!safeColor(accent_color))return res.status(400).json({error:'Цвет должен быть в формате #RRGGBB'});if(background_color!==undefined&&!safeColor(background_color))return res.status(400).json({error:'Фон должен быть в формате #RRGGBB'});if(theme!==undefined&&!safeTheme(theme))return res.status(400).json({error:'Неизвестная тема'});const r=await pool.query(`UPDATE restaurants SET name=COALESCE($2,name),subtitle=COALESCE($3,subtitle),phone=COALESCE($4,phone),address=COALESCE($5,address),service=COALESCE($6,service),active=COALESCE($7,active),logo_url=COALESCE($8,logo_url),hero_image_url=COALESCE($9,hero_image_url),accent_color=COALESCE($10,accent_color),theme=COALESCE($11,theme),background_color=COALESCE($12,background_color),card_style=COALESCE($13,card_style),corner_radius=COALESCE($14,corner_radius),font_style=COALESCE($15,font_style),hero_height=COALESCE($16,hero_height),hero_overlay=COALESCE($17,hero_overlay),category_style=COALESCE($18,category_style),card_columns=COALESCE($19,card_columns),design_settings=COALESCE($20,design_settings) WHERE id=$1 RETURNING *`,[req.params.id,name===undefined?null:String(name).trim(),subtitle??null,phone??null,address??null,service??null,active??null,logo_url??null,hero_image_url??null,accent_color??null,theme??null,background_color??null,card_style??null,corner_radius??null,font_style??null,hero_height??null,hero_overlay??null,category_style??null,card_columns??null,settings]);if(!r.rowCount)return res.status(404).json({error:'Restaurant not found'});res.json(r.rows[0]);});
app.delete('/api/admin/restaurants/:id',auth,requireDb,async(req,res)=>{try{const r=await pool.query("DELETE FROM restaurants WHERE id=$1 AND slug<>'demo' RETURNING id,slug,name",[req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Клиент не найден или защищён от удаления'});res.json({ok:true,...r.rows[0]});}catch(e){console.error(e);res.status(500).json({error:'Не удалось удалить клиента'});}});
app.post('/api/admin/restaurants/:id/client-access',auth,requireDb,async(req,res)=>{try{const {enabled=true,username,password}=req.body||{},u=String(username||'').trim().toLowerCase();const existing=await pool.query('SELECT * FROM client_accounts WHERE restaurant_id=$1',[req.params.id]);if(!enabled&&existing.rowCount){await pool.query('UPDATE client_accounts SET enabled=FALSE WHERE restaurant_id=$1',[req.params.id]);return res.json({ok:true,enabled:false});}if(!u||!/^[a-z0-9._-]{3,40}$/.test(u))return res.status(400).json({error:'Логин: 3–40 символов, латиница/цифры'});let salt=existing.rows[0]?.password_salt,hash=existing.rows[0]?.password_hash;if(password){if(String(password).length<8)return res.status(400).json({error:'Пароль должен быть минимум 8 символов'});({salt,hash}=hashPassword(password));}if(!hash)return res.status(400).json({error:'Задайте пароль клиенту'});const r=await pool.query(`INSERT INTO client_accounts(restaurant_id,username,password_hash,password_salt,enabled) VALUES($1,$2,$3,$4,TRUE) ON CONFLICT(restaurant_id) DO UPDATE SET username=EXCLUDED.username,password_hash=EXCLUDED.password_hash,password_salt=EXCLUDED.password_salt,enabled=TRUE RETURNING username,enabled`,[req.params.id,u,hash,salt]);res.json(r.rows[0]);}catch(e){if(e.code==='23505')return res.status(409).json({error:'Такой логин уже занят'});console.error(e);res.status(500).json({error:'Не удалось настроить доступ'});}});
app.post('/api/admin/restaurants/:id/categories',auth,requireDb,async(req,res)=>{const name=String(req.body?.name||'').trim();if(!name)return res.status(400).json({error:'Укажите категорию'});try{const r=await pool.query('INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM categories WHERE restaurant_id=$1)) RETURNING *',[req.params.id,name]);res.status(201).json(r.rows[0]);}catch(e){if(e.code==='23505')return res.status(409).json({error:'Такая категория уже есть'});res.status(500).json({error:'Server error'});}});
app.delete('/api/admin/restaurants/:restaurantId/categories/:categoryId',auth,requireDb,async(req,res)=>{try{const r=await pool.query('DELETE FROM categories WHERE id=$1 AND restaurant_id=$2 RETURNING id,name',[req.params.categoryId,req.params.restaurantId]);if(!r.rowCount)return res.status(404).json({error:'Категория не найдена'});res.json({ok:true,...r.rows[0]});}catch(e){console.error(e);res.status(500).json({error:'Не удалось удалить категорию'});}});
app.post('/api/admin/restaurants/:id/dishes',auth,requireDb,async(req,res)=>{const {category_id,name,description='',price,image_url='',emoji='',badge=''}=req.body||{},variants=normalizeVariants(req.body?.variants);if(variants===null)return res.status(400).json({error:'Проверьте варианты и цены'});const finalPrice=resolvedPrice(price,variants);if(!String(name||'').trim()||finalPrice===null)return res.status(400).json({error:'Проверьте название и цену'});const r=await pool.query(`INSERT INTO dishes(restaurant_id,category_id,name,description,price,variants,image_url,emoji,badge,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM dishes WHERE restaurant_id=$1)) RETURNING *`,[req.params.id,category_id||null,String(name).trim(),description,finalPrice,JSON.stringify(variants||[]),image_url,emoji,badge]);res.status(201).json(r.rows[0]);});
app.patch('/api/admin/dishes/:id',auth,requireDb,async(req,res)=>{const {name,description,price,image_url,emoji,badge,active,category_id}=req.body||{},variants=normalizeVariants(req.body?.variants);if(variants===null)return res.status(400).json({error:'Проверьте варианты и цены'});const current=await pool.query('SELECT price FROM dishes WHERE id=$1',[req.params.id]);if(!current.rowCount)return res.status(404).json({error:'Dish not found'});const finalPrice=resolvedPrice(price,variants,current.rows[0].price);if(finalPrice===null)return res.status(400).json({error:'Проверьте цену'});const r=await pool.query(`UPDATE dishes SET name=COALESCE($2,name),description=COALESCE($3,description),price=$4,variants=COALESCE($5,variants),image_url=COALESCE($6,image_url),emoji=COALESCE($7,emoji),badge=COALESCE($8,badge),active=COALESCE($9,active),category_id=COALESCE($10,category_id) WHERE id=$1 RETURNING *`,[req.params.id,name??null,description??null,finalPrice,variants===undefined?null:JSON.stringify(variants),image_url??null,emoji??null,badge??null,active??null,category_id??null]);res.json(r.rows[0]);});
app.delete('/api/admin/dishes/:id',auth,requireDb,async(req,res)=>{const r=await pool.query('DELETE FROM dishes WHERE id=$1 RETURNING id',[req.params.id]);if(!r.rowCount)return res.status(404).json({error:'Dish not found'});res.json({ok:true});});

app.post('/api/client/login',requireDb,async(req,res)=>{const username=String(req.body?.username||'').trim().toLowerCase(),password=String(req.body?.password||'');const r=await pool.query('SELECT * FROM client_accounts WHERE username=$1 AND enabled=TRUE',[username]);if(!r.rowCount||!verifyPassword(password,r.rows[0].password_salt,r.rows[0].password_hash))return res.status(401).json({error:'Неверный логин или пароль'});res.cookie('qr_client',signSession(r.rows[0].id),{httpOnly:true,sameSite:'lax',secure:req.secure,maxAge:1000*60*60*24*14,path:'/'});res.json({ok:true});});
app.post('/api/client/logout',(_req,res)=>{res.clearCookie('qr_client',{path:'/'});res.json({ok:true});});
app.get('/api/client/me',requireDb,clientAuth,async(req,res)=>{const data=await menuPayload(req.client.restaurant_id);res.json({...data,account:{username:req.client.username}});});
app.patch('/api/client/restaurant',requireDb,clientAuth,async(req,res)=>{const {name,subtitle,phone,address,service,logo_url,hero_image_url,accent_color,theme}=req.body||{};if(name!==undefined&&!String(name).trim())return res.status(400).json({error:'Укажите название'});if(accent_color!==undefined&&!safeColor(accent_color))return res.status(400).json({error:'Цвет должен быть в формате #RRGGBB'});if(theme!==undefined&&!safeTheme(theme))return res.status(400).json({error:'Неизвестная тема'});const r=await pool.query(`UPDATE restaurants SET name=COALESCE($2,name),subtitle=COALESCE($3,subtitle),phone=COALESCE($4,phone),address=COALESCE($5,address),service=COALESCE($6,service),logo_url=COALESCE($7,logo_url),hero_image_url=COALESCE($8,hero_image_url),accent_color=COALESCE($9,accent_color),theme=COALESCE($10,theme) WHERE id=$1 RETURNING *`,[req.client.restaurant_id,name??null,subtitle??null,phone??null,address??null,service??null,logo_url??null,hero_image_url??null,accent_color??null,theme??null]);res.json(r.rows[0]);});
app.post('/api/client/categories',requireDb,clientAuth,async(req,res)=>{const name=String(req.body?.name||'').trim();if(!name)return res.status(400).json({error:'Укажите категорию'});try{const r=await pool.query('INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM categories WHERE restaurant_id=$1)) RETURNING *',[req.client.restaurant_id,name]);res.status(201).json(r.rows[0]);}catch(e){if(e.code==='23505')return res.status(409).json({error:'Такая категория уже есть'});res.status(500).json({error:'Ошибка'});}});
app.post('/api/client/dishes',requireDb,clientAuth,async(req,res)=>{const {category_id,name,description='',price,image_url='',emoji='',badge=''}=req.body||{},variants=normalizeVariants(req.body?.variants);if(variants===null)return res.status(400).json({error:'Проверьте варианты и цены'});const finalPrice=resolvedPrice(price,variants);if(!String(name||'').trim()||finalPrice===null)return res.status(400).json({error:'Проверьте название и цену'});if(category_id){const c=await pool.query('SELECT 1 FROM categories WHERE id=$1 AND restaurant_id=$2',[category_id,req.client.restaurant_id]);if(!c.rowCount)return res.status(400).json({error:'Категория не найдена'});}const r=await pool.query(`INSERT INTO dishes(restaurant_id,category_id,name,description,price,variants,image_url,emoji,badge,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,(SELECT COALESCE(MAX(sort_order),-1)+1 FROM dishes WHERE restaurant_id=$1)) RETURNING *`,[req.client.restaurant_id,category_id||null,String(name).trim(),description,finalPrice,JSON.stringify(variants||[]),image_url,emoji,badge]);res.status(201).json(r.rows[0]);});
app.patch('/api/client/dishes/:id',requireDb,clientAuth,async(req,res)=>{const {name,description,price,image_url,emoji,badge,active,category_id}=req.body||{},variants=normalizeVariants(req.body?.variants);if(variants===null)return res.status(400).json({error:'Проверьте варианты и цены'});if(category_id){const c=await pool.query('SELECT 1 FROM categories WHERE id=$1 AND restaurant_id=$2',[category_id,req.client.restaurant_id]);if(!c.rowCount)return res.status(400).json({error:'Категория не найдена'});}const current=await pool.query('SELECT price FROM dishes WHERE id=$1 AND restaurant_id=$2',[req.params.id,req.client.restaurant_id]);if(!current.rowCount)return res.status(404).json({error:'Блюдо не найдено'});const finalPrice=resolvedPrice(price,variants,current.rows[0].price);if(finalPrice===null)return res.status(400).json({error:'Проверьте цену'});const r=await pool.query(`UPDATE dishes SET name=COALESCE($3,name),description=COALESCE($4,description),price=$5,variants=COALESCE($6,variants),image_url=COALESCE($7,image_url),emoji=COALESCE($8,emoji),badge=COALESCE($9,badge),active=COALESCE($10,active),category_id=COALESCE($11,category_id) WHERE id=$1 AND restaurant_id=$2 RETURNING *`,[req.params.id,req.client.restaurant_id,name??null,description??null,finalPrice,variants===undefined?null:JSON.stringify(variants),image_url??null,emoji??null,badge??null,active??null,category_id??null]);res.json(r.rows[0]);});
app.delete('/api/client/dishes/:id',requireDb,clientAuth,async(req,res)=>{const r=await pool.query('DELETE FROM dishes WHERE id=$1 AND restaurant_id=$2 RETURNING id',[req.params.id,req.client.restaurant_id]);if(!r.rowCount)return res.status(404).json({error:'Блюдо не найдено'});res.json({ok:true});});

app.get('/r/:slug',async(req,res)=>{try{let brand=req.params.slug==='demo'?demo.restaurant:{};if(pool){const q=await pool.query(`SELECT accent_color,theme,background_color,design_settings FROM restaurants WHERE slug=$1 AND active=TRUE`,[req.params.slug]);if(q.rowCount)brand=q.rows[0]}const extra=typeof brand.design_settings==='string'?JSON.parse(brand.design_settings||'{}'):(brand.design_settings||{}),v={...brand,...extra},accent=safeColor(v.accent_color)?v.accent_color:'#151515',bg=safeColor(v.background_color)?v.background_color:(v.theme==='dark'?'#151515':'#f5f4ef'),text=safeColor(v.text_color)?v.text_color:(v.theme==='dark'?'#f4f2ed':'#151515'),card=safeColor(v.card_color)?v.card_color:(v.theme==='dark'?'#242424':'#ffffff'),header=safeColor(v.header_color)?v.header_color:'#111111',bootstrap=`<link rel="stylesheet" href="/public-design-studio.css?v=4"><style id="serverBranding">:root{--accent:${accent};--menu-bg:${bg};--menu-text:${text};--menu-card:${card};--menu-header:${header}}html,body{background:${bg};color:${text}}</style>`;const html=(await fs.readFile(path.join(__dirname,'index.html'),'utf8')).replace('</head>',`${bootstrap}</head>`).replace('<script src="/app.js','<script src="/public-design-runtime.js?v=4"></script><script src="/app.js');res.set('Cache-Control','no-store');res.type('html').send(html)}catch(e){console.error(e);res.status(500).send('Menu unavailable')}});
app.get('/admin',auth,async(_req,res)=>{try{const html=await fs.readFile(path.join(__dirname,'admin.html'),'utf8'),version='admin-image-editor-1',fresh=html.replace('/admin-client-workspace.css?v=8',`/admin-client-workspace.css?v=${version}`).replace('/admin-polish-v2.css?v=dfc7795',`/admin-polish-v2.css?v=${version}`).replace('/admin-client-workspace.js?v=3',`/admin-client-workspace.js?v=${version}`).replace('/admin-category-manager.js?v=6bc8401',`/admin-category-manager.js?v=${version}`).replace('</head>',`<link rel="stylesheet" href="/admin-premium.css?v=${version}"><link rel="stylesheet" href="/admin-design-studio.css?v=${version}"><link rel="stylesheet" href="/admin-image-editor.css?v=${version}"></head>`).replace('</body>',`<script src="/admin-premium.js?v=${version}"></script><script src="/admin-design-studio.js?v=${version}"></script><script src="/admin-image-editor.js?v=${version}"></script></body>`);res.set('Cache-Control','no-store, no-cache, must-revalidate');res.set('Pragma','no-cache');res.type('html').send(fresh)}catch(e){console.error(e);res.status(500).send('Admin page unavailable')}});
app.get('/client',(_req,res)=>res.sendFile(path.join(__dirname,'client.html')));
app.get('/',(_req,res)=>res.redirect('/landing.html'));

initDb().then(()=>app.listen(PORT,()=>console.log(`QR Menu запущено на порту ${PORT}`))).catch(e=>{console.error('Database initialization failed:',e);process.exit(1);});
