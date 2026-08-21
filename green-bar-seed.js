const crypto = require('crypto');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || '';
const CLIENT_PASSWORD = process.env.GREEN_BAR_CLIENT_PASSWORD || '';
const CLIENT_USERNAME = String(process.env.GREEN_BAR_CLIENT_USERNAME || 'greenbar').trim().toLowerCase();

const restaurant = {
  name: 'GREEN LOUNGE-BAR',
  slug: 'green-bar',
  subtitle: '@greenbar_17 • 16:00–04:00',
  phone: '',
  address: '',
  service: 'Обслуживание 15%',
  logo_url: '',
  hero_image_url: '',
  accent_color: '#0b6b3a',
  theme: 'warm'
};

const menu = [
  ['Суши/роллы', [
    ['Калифорния',2490],['Филадельфия',2790],['Капа маки',1890],['Унаги темпура',2890],['Америка темпура',2690],['Цезарь темпура',2490]
  ]],
  ['Гарниры', [
    ['Фри',790],['Дольки',890],['Овощи на гриле',1290],['Рис',990],['Пюре',990]
  ]],
  ['Банкетные блюда', [
    ['Шашлычный микс',15990,'', [{name:'6 персон',price:15990},{name:'12 персон',price:29990}]],
    ['Гриль микс',18990,'', [{name:'6 персон',price:18990},{name:'12 персон',price:31990}]],
    ['Куырдак',24500,'', [{name:'6 персон',price:24500},{name:'1 астау',price:44500}]]
  ]],
  ['Салаты', [
    ['Теплый салат из телятины',2790,'Микс салата, телятина, кабачки, баклажан, соус барбекю, светофор, сыр творожный, черри'],
    ['Хрустящий баклажан',2790,'Баклажан, кляр, кисло-сладкое соус, черри, руколла'],
    ['Греческий',2190,'Помидор, огурец, лук, микс салата, светофор, маслины, фетакса'],
    ['Цезарь с курицей',2890,'Айсберг, соус фирменный, черри, курица, яйцо перепелиный, сухарик, пармезан'],
    ['Цезарь с креветками',3190],
    ['Руколла с креветками',3190,'Руколла, креветки, соус медовый, черри, пармезан, яйцо, сыр творожный'],
    ['Фруктовый салат',2890,'Фрукты, йогурт, взбитые сливки'],
    ['Салат – микс с семгой',2890,'Микс салата, семга, медовый соус, черри, грецкие орехи, творожные сыр']
  ]],
  ['Первые блюда', [
    ['Рамен с курицей',2390,'Бульон, курица, кукуруза, шампиньоны, яйцо, лук зеленый, кунжут'],
    ['Рамен с мясом',2590],
    ['Солянка',2290,'Мясо, копченая говядина, сосиски, охотничьи колбаски, салями, маслины, лимонный сок'],
    ['Пельмени',1890,'Бульон, пельмени, укроп, сметана'],
    ['Том – ям',3290,'Креветки, семга, кокосовое молоко, том ям паста, шампиньоны, рис'],
    ['Чечевичный суп',1990]
  ]],
  ['Закуски', [
    ['Овощное ассорти',3490,'Помидоры, огурцы, светофор, микс салата, сулугуни'],
    ['Русская закуска',3690,'Соленые огурцы, маслины, лимон, селедка, картошка, лук'],
    ['Фруктовая нарезка',4290,'Яблоко, груша, ананас, киви, банан, виноград, апельсин, сахарная пудра'],
    ['Соленый погребок',3890,'Корнишон, шампиньоны, помидоры, молодая кукуруза, патиссон'],
    ['Пивное ассорти',5490,'Охотничьи колбаски, сырные палочки, гренки, дольки, креветки в панировке'],
    ['Жареные креветки',3890]
  ]],
  ['Ассорти', [
    ['Куриное ассорти',5490,'Крылышки, голень, наггетсы, соус кисло-сладкий']
  ]],
  ['Вторые блюда', [
    ['Телятина с овощами',2790,'Телятина, баклажан, кабачки, светофор, шампиньоны, лук, кинза, соя соус, кетчуп'],
    ['Цыпленок табака',3890,'Цыпленок, маринад фирменный, соус томатный'],
    ['Курица в сливочном соусе',3290,'Курица, шампиньоны, сливки, микс салата, рис'],
    ['Куырдак из баранины',4490,'Мясо, картофель, лук шалот, зеленый лук'],
    ['Куриное филе с сыром',3590,'Куриное филе, шампиньоны, сулугуни, сливочный соус'],
    ['Бефстроганов',2990,'Вырезка, пюре, шампиньоны, сливочный соус'],
    ['Телятина с хрустящим картофелем',2890,'Телятина, картофель, сливки, шампиньоны, лук зеленый']
  ]],
  ['Паста', [
    ['Альфредо',2890,'Курица, шампиньоны, сливки, пармезан'],
    ['Спагетти болоньезе',3190,'Фарш, томат, пармезан'],
    ['Спагетти с креветками',3190,'Креветки, сливки, пармезан'],
    ['Фетучини с морепродуктами',3290,'Семга, креветки, сливки, пармезан']
  ]],
  ['Пицца', [
    ['Цезарь',2590],['Казахстан',2990],['Пепперони',2690],['Маргарита',2590],['Куриная',2590],['Четыре сезона',2890],['Болоньезе',2890],['Хачапури',2590],['Мексикано',2490]
  ]],
  ['Стейки', [
    ['Рибай',5490],['Тибон',5490],['Медальоны в сливочном соусе',5590],['Семга запеченная',4990]
  ]],
  ['Фаст-фуд', [
    ['Бургер с фри',2790],['Биг бургер',3190],['Чикен бургер',2790],['Клаб-сэндвич',2590],['Наггетсы',2290]
  ]],
  ['Чай', [
    ['Ягодный чай',1590],['Фруктовый чай',1590],['Марокканский чай',1590],['Ташкентский чай',1590],['Апельсиновый чай',1590],['Черный чай',890],['Зеленый чай',890],['Тары чай',1690]
  ]],
  ['К чаю', [
    ['Лимон',590],['Шоколад Alpen gold',990],['Шоколад Kazakhstan',1590],['Молоко',490],['Мёд',590]
  ]],
  ['Прохладительные напитки', [
    ['Cola, Fanta, Sprite',890,'', [{name:'0.25 L',price:890},{name:'1 L',price:1090}]],
    ['Piko (в ассортименте)',1390],['Tassay',690,'1 L'],['Borjomi',1190],['Turan',690,'0.25 L'],['Red bull',1090]
  ]],
  ['Лимонады', [
    ['Манго-Маракуйя',1090,'', [{name:'0.5 л',price:1090},{name:'1 л',price:2090}]],
    ['Киви-Лайм',1090,'', [{name:'0.5 л',price:1090},{name:'1 л',price:2090}]],
    ['Тропический',1290,'', [{name:'0.5 л',price:1290},{name:'1 л',price:2490}]],
    ['Ягодный',1290,'', [{name:'0.5 л',price:1290},{name:'1 л',price:2490}]],
    ['Апельсиновый',1090,'', [{name:'0.5 л',price:1090},{name:'1 л',price:2090}]],
    ['Мохито',1090,'', [{name:'0.5 л',price:1090},{name:'1 л',price:2090}]],
    ['Манго-ананас',1190,'', [{name:'0.5 л',price:1190},{name:'1 л',price:2290}]]
  ]],
  ['Пиво разливное', [['Praga',790]]],
  ['Пиво бутылочное', [['Miller',1390],['Corona extra',2590]]],
  ['Закуски к пиву', [['Фисташки',1490],['Арахис',990],['Чипсы',1390],['Чечил',1190],['Курт',690],['Гренки',1190]]],
  ['Водка', [['Absolut',1290],['Кызыл жар',690],['Бульбаш',890],['Grey Goose',1790]]],
  ['Виски', [['Chivas Regal 12 Y.O.',2590],['Ballantine Finest',1290],['Jameson',1790],['Jack Daniels',1990],['William Lawsons',1090]]],
  ['Коньяк', [['Ararat 3 Y.O.',1290],['Kazakhstan 3 Y.O.',990]]],
  ['Ром', [['Bacardi Carta Blanca',990],['Bacardi Carta Negra',1290]]],
  ['Джин', [['Beefeater',1190]]],
  ['Текила', [['Olmeca Blanco',1790],['Olmeca Gold',1790]]],
  ['Вермуты', [['Martini Fierro',1190],['Martini Bianco',1190],['Martini Rosso',1190]]],
  ['Вино', [['Kindzmarauli',8500],['Алазанская Долина',7500],['Saperavi',7500],['Casillero Tel Diablo',12000]]],
  ['Шампанское', [['Martini Asti',11000],['Lambrusco Bianco',7000],['Abrau Durso',5500]]],
  ['Настойки и биттеры', [['Jagermeister',1590],['Campari',1590],['Aperol',1490]]],
  ['Ликеры', [['Kahlua',1490],['Baileys',1490],['Absinthe',1690],['Malibu',1490]]],
  ['Алкогольные напитки', [['Pina Colada',2490],['Секс на пляже',2490],['Long Island',2790],['Mojito',1890],['Mojito Energy',2290],['Mojito Strawberry',2290],['Голубая лагуна',2190]]],
  ['Спритц-коктейли', [['Aperol-Spritz',2190]]],
  ['Шоты', [['B-52',1690],['B-53',1690]]]
];

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(String(password), salt, 64).toString('hex') };
}

async function seedGreenBar() {
  if (!DATABASE_URL) {
    console.log('GREEN BAR seed skipped: DATABASE_URL is not configured');
    return;
  }
  const pool = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM restaurants WHERE slug=$1 LIMIT 1', [restaurant.slug]);
    if (existing.rowCount) {
      console.log('GREEN BAR already exists; seed skipped to preserve admin/client edits');
      await client.query('ROLLBACK');
      return;
    }

    const rr = await client.query(`
      INSERT INTO restaurants(name,slug,subtitle,phone,address,service,logo_url,hero_image_url,accent_color,theme,active)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE) RETURNING id
    `, [restaurant.name,restaurant.slug,restaurant.subtitle,restaurant.phone,restaurant.address,restaurant.service,restaurant.logo_url,restaurant.hero_image_url,restaurant.accent_color,restaurant.theme]);
    const rid = rr.rows[0].id;
    let dishOrder = 0;

    for (let ci = 0; ci < menu.length; ci++) {
      const [categoryName, dishes] = menu[ci];
      const cr = await client.query('INSERT INTO categories(restaurant_id,name,sort_order) VALUES($1,$2,$3) RETURNING id', [rid,categoryName,ci]);
      const categoryId = cr.rows[0].id;
      for (const item of dishes) {
        const [name,price,description='',variants=[]] = item;
        await client.query(`
          INSERT INTO dishes(restaurant_id,category_id,name,description,price,variants,image_url,emoji,badge,active,sort_order)
          VALUES($1,$2,$3,$4,$5,$6::jsonb,'','','',TRUE,$7)
        `, [rid,categoryId,name,description,price,JSON.stringify(variants),dishOrder++]);
      }
    }

    if (CLIENT_PASSWORD) {
      if (!/^[a-z0-9._-]{3,40}$/.test(CLIENT_USERNAME)) throw new Error('GREEN_BAR_CLIENT_USERNAME is invalid');
      if (CLIENT_PASSWORD.length < 8) throw new Error('GREEN_BAR_CLIENT_PASSWORD must contain at least 8 characters');
      const { salt, hash } = hashPassword(CLIENT_PASSWORD);
      await client.query(`
        INSERT INTO client_accounts(restaurant_id,username,password_hash,password_salt,enabled)
        VALUES($1,$2,$3,$4,TRUE)
      `, [rid,CLIENT_USERNAME,hash,salt]);
      console.log(`GREEN BAR client cabinet enabled for username: ${CLIENT_USERNAME}`);
    } else {
      console.log('GREEN BAR menu created; client cabinet password is waiting for GREEN_BAR_CLIENT_PASSWORD');
    }

    await client.query('COMMIT');
    console.log(`GREEN BAR seeded successfully: ${dishOrder} menu positions`);
  } catch (error) {
    await client.query('ROLLBACK').catch(()=>{});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedGreenBar().catch(error => {
  console.error('GREEN BAR seed failed:', error);
  process.exit(1);
});
