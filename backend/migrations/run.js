require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

const run = async () => {
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    await pool.query(sql);
    console.log(`✅ ${file} done`);
  }
  await pool.end();
};

run().catch((err) => { console.error(err); process.exit(1); });
