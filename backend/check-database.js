// Compares YOUR database with what this app needs.
//   node check-database.js          -> shows every problem it finds, changes nothing
//   node check-database.js --fix    -> repairs them (your data is kept)
import 'dotenv/config';
import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';

const FIX = process.argv.includes('--fix');
const db = process.env.DB_NAME || 'bryans_arabella';
const ref = `${db}__reference`;
const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', multipleStatements: true,
});
const q = (sql, args) => conn.query(sql, args).then(([r]) => r);
const found = [];
let fixed = 0;

const cols = async (schema) => {
  const rows = await q(`SELECT TABLE_NAME t, COLUMN_NAME c, COLUMN_TYPE ty, IS_NULLABLE nl, COLUMN_DEFAULT df, EXTRA ex
                        FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?`, [schema]);
  const m = {};
  for (const r of rows) (m[r.t] ??= {})[r.c] = r;
  return m;
};
const defClause = (c) => {
  if (c.df == null || String(c.df).toUpperCase() === 'NULL') return '';
  const raw = String(c.df).replace(/^'(.*)'$/s, '$1');
  if (/current_timestamp/i.test(raw)) return ` DEFAULT ${raw}`;
  return /^(tiny|small|medium|big)?int|decimal|float|double|bit/i.test(c.ty) ? ` DEFAULT ${Number(raw)}` : ` DEFAULT ${conn.escape(raw)}`;
};
const colDef = (c, forceNull = false) => `${c.ty} ${forceNull || c.nl === 'YES' ? 'NULL' : 'NOT NULL'}${defClause(c)}`;
const apply = async (problem, sql) => {
  found.push(problem);
  console.log(`- ${problem}`);
  if (FIX) { await conn.query(sql); fixed++; console.log('    fixed'); }
};

try {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`DROP DATABASE IF EXISTS \`${ref}\``);
  await conn.query(`CREATE DATABASE \`${ref}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${ref}\``);
  await conn.query(await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
  await conn.query(`USE \`${db}\``);

  const want = await cols(ref), have = await cols(db);
  console.log(`Checking database "${db}"...\n`);

  // An old Laravel token table has a different shape. setup.js sets it aside.
  if (have.personal_access_tokens && !have.personal_access_tokens.token_hash)
    console.log('- personal_access_tokens is an old Laravel table. Run "npm run db:setup" to set it aside.');

  for (const [table, wc] of Object.entries(want)) {
    const hc = have[table];
    if (!hc) { found.push(`${table} missing`); console.log(`- table "${table}" is missing`); if (FIX) { await conn.query(await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8')); fixed++; console.log('    created'); } continue; }
    if (table === 'personal_access_tokens' && !hc.token_hash) continue;
    for (const [name, c] of Object.entries(wc)) {
      const h = hc[name];
      if (!h) await apply(`${table}.${name} is missing`, `ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${colDef(c)}`);
      else if (/^enum/i.test(c.ty) && c.ty.toLowerCase() !== h.ty.toLowerCase())
        await apply(`${table}.${name} has different allowed values (${h.ty})`, `ALTER TABLE \`${table}\` MODIFY COLUMN \`${name}\` ${colDef(c)}`);
    }
    // Extra columns that are required but have no default make every insert fail
    for (const [name, h] of Object.entries(hc)) {
      if (wc[name]) continue;
      if (h.nl === 'NO' && h.df == null && !/auto_increment|generated/i.test(h.ex))
        await apply(`${table}.${name} is required but this app never fills it in`, `ALTER TABLE \`${table}\` MODIFY COLUMN \`${name}\` ${colDef(h, true)}`);
    }
  }
  console.log(found.length === 0 ? 'Everything matches. No problems found.' : FIX ? `\nRepaired ${fixed} problem(s). Restart the backend and try again.` : `\nFound ${found.length} problem(s). Run "node check-database.js --fix" to repair them.`);
} catch (e) {
  console.error('Check failed:', e.sqlMessage || e.message || e.code);
  process.exitCode = 1;
} finally {
  await conn.query(`DROP DATABASE IF EXISTS \`${ref}\``).catch(() => {});
  await conn.end();
}
