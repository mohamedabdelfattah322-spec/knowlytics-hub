const { query } = require('../config/database');

// GET /api/categories — public list with course count
const listCategories = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*,
              COUNT(co.id)::int AS course_count
       FROM categories c
       LEFT JOIN courses co ON co.category_id = c.id AND co.is_published = true
       GROUP BY c.id
       ORDER BY c.order_index`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/categories/:id
const getCategory = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// POST /api/categories (admin)
const createCategory = async (req, res, next) => {
  try {
    const { name, name_ar, slug, icon, parent_id, order_index } = req.body;
    const result = await query(
      `INSERT INTO categories (name, name_ar, slug, icon, parent_id, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, name_ar, slug || name.toLowerCase().replace(/\s+/g, '-'), icon, parent_id, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/categories/:id (admin)
const updateCategory = async (req, res, next) => {
  try {
    const { name, name_ar, slug, icon, parent_id, order_index } = req.body;
    const result = await query(
      `UPDATE categories SET name = COALESCE($1, name), name_ar = COALESCE($2, name_ar),
       slug = COALESCE($3, slug), icon = COALESCE($4, icon),
       parent_id = $5, order_index = COALESCE($6, order_index)
       WHERE id = $7 RETURNING *`,
      [name, name_ar, slug, icon, parent_id, order_index, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/categories/:id (admin)
const deleteCategory = async (req, res, next) => {
  try {
    await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Category deleted' });
  } catch (err) { next(err); }
};

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
