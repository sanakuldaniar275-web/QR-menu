const crypto = require('crypto');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || '';
const USERNAME = String(process.env.GREEN_BAR_CLIENT_USERNAME || 'greenbar').trim().toLowerCase();
const PASSWORD = process.env.GREEN_BAR_CLIENT_PASSWORD || '';
const FALLBACK_SALT = '367d391da5be073dbc714f4267c0f992';
const FALLBACK_HASH = 'a2228212bb6cbdc5fea1bc3a37e535d5a307cb6be7cece3d67df720b58db153fef5c4d7f1873ece675c0d624ad4362ef8df3b480d4793490a9a4e178d51b4904';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(String(password), salt, 64).toString('hex') };
}

async function run() {
  if (!DATABASE_URL) return;
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const restaurant = await pool.query("SELECT id FROM restaurants WHERE slug='green-bar' LIMIT 1");
    if (!restaurant.rowCount) {
      console.log('GREEN BAR client account skipped: restaurant not created yet');
      return;
    }
    const rid = restaurant.rows[0].id;
    const existing = await pool.query('SELECT id FROM client_accounts WHERE restaurant_id=$1 LIMIT 1', [rid]);
    if (existing.rowCount) {
      console.log('GREEN BAR client cabinet already exists');
      return;
    }
    if (!/^[a-z0-9._-]{3,40}$/.test(USERNAME)) throw new Error('Invalid GREEN BAR client username');
    let salt = FALLBACK_SALT;
    let hash = FALLBACK_HASH;
    if (PASSWORD) {
      if (PASSWORD.length < 8) throw new Error('GREEN_BAR_CLIENT_PASSWORD must contain at least 8 characters');
      ({ salt, hash } = hashPassword(PASSWORD));
    }
    await pool.query(`
      INSERT INTO client_accounts(restaurant_id,username,password_hash,password_salt,enabled)
      VALUES($1,$2,$3,$4,TRUE)
    `, [rid, USERNAME, hash, salt]);
    console.log(`GREEN BAR client cabinet enabled for username: ${USERNAME}`);
  } finally {
    await pool.end();
  }
}

run().catch(error => {
  console.error('GREEN BAR client account setup failed:', error);
  process.exit(1);
});
