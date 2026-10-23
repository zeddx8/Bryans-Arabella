// Creates or UPGRADES the database. Safe to run again at any time.
//  - creates missing tables
//  - adds columns older databases are missing (for example one built from the original spec SQL)
//  - sets aside an old Laravel "personal_access_tokens" table, which has a different shape
//  - creates the first admin and starter categories
import 'dotenv/config';
import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const db = process.env.DB_NAME || 'bryans_arabella';
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

try {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${db}\``);

  const columnsOf = async (table) => {
    const [r] = await conn.query('SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?', [db, table]);
    return r.map((x) => x.c);
  };

  // 1. An old Laravel Sanctum token table has no token_hash column. Keep it as a backup under a new name.
  const tokenCols = await columnsOf('personal_access_tokens');
  if (tokenCols.length && !tokenCols.includes('token_hash')) {
    const backup = `personal_access_tokens_old_${Date.now()}`;
    await conn.query(`RENAME TABLE personal_access_tokens TO \`${backup}\``);
    console.log(`Old token table kept as ${backup}`);
  }

  // 2. Create any table that does not exist yet
  await conn.query(await fs.readFile(new URL('../schema.sql', import.meta.url), 'utf8'));

  // 3. Add columns that older tables are missing
  const needed = {
    products: [['sku', 'VARCHAR(100) NULL'], ['cost_price', 'DECIMAL(10,2) NULL'], ['deleted_at', 'TIMESTAMP NULL']],
    users: [['email_verified_at', 'TIMESTAMP NULL']],
    reviews: [['title', 'VARCHAR(255) NULL']],
    order_items: [['product_name', 'VARCHAR(255) NULL']],
  };
  for (const [table, cols] of Object.entries(needed)) {
    const have = await columnsOf(table);
    for (const [name, def] of cols) {
      if (!have.includes(name)) {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${def}`);
        console.log(`Added ${table}.${name}`);
        // People who signed up before verification existed are not locked out
        if (table === 'users' && name === 'email_verified_at') await conn.query('UPDATE users SET email_verified_at = NOW()');
      }
    }
  }
  await conn.query('UPDATE order_items oi JOIN products p ON p.id = oi.product_id SET oi.product_name = p.name WHERE oi.product_name IS NULL');

  // 4. First admin and starter categories
  const email = (process.env.ADMIN_EMAIL || 'admin@bryansarabella.com').toLowerCase();
  const [ex] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
  if (!ex.length) {
    await conn.query(
      "INSERT INTO users (name,email,password,role,email_verified_at,created_at,updated_at) VALUES (?,?,?,'admin',NOW(),NOW(),NOW())",
      [process.env.ADMIN_NAME || 'Admin', email, await bcrypt.hash(process.env.ADMIN_PASSWORD || 'ChangeMe123!', 10)]);
    console.log(`Admin created: ${email}`);
  }
  for (const [name, slug] of [['Handbags', 'handbags'], ['Tote Bags', 'tote-bags'], ['Crossbody Bags', 'crossbody-bags'], ['Clutches', 'clutches'], ['Backpacks', 'backpacks']])
    await conn.query('INSERT IGNORE INTO categories (name,slug,created_at,updated_at) VALUES (?,?,NOW(),NOW())', [name, slug]);
  console.log('Database ready.');
} catch (e) {
  console.error('Setup failed:', e.sqlMessage || e.message || e.code);
  process.exitCode = 1;
} finally {
  await conn.end();
}
