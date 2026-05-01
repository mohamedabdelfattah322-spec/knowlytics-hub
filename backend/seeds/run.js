require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/database');

const run = async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'sample_data.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ Seed data inserted');
  await pool.end();
};

run().catch((err) => { console.error(err); process.exit(1); });
