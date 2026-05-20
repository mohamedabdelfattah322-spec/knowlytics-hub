const { query } = require('../config/database');

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT ci.id, ci.course_id, ci.bundle_id, ci.added_at,
              c.title AS course_title, c.thumbnail_url AS course_thumbnail,
              c.price AS course_price, c.type AS course_type,
              u.name AS instructor_name,
              b.name AS bundle_name, b.price AS bundle_price, b.thumbnail_url AS bundle_thumbnail
       FROM cart_items ci
       LEFT JOIN courses c ON c.id = ci.course_id
       LEFT JOIN users u ON u.id = c.instructor_id
       LEFT JOIN bundles b ON b.id = ci.bundle_id
       WHERE ci.user_id = $1
       ORDER BY ci.added_at DESC`,
      [req.user.user_id]
    );

    // Calculate total
    let total = 0;
    for (const item of result.rows) {
      total += parseFloat(item.course_price || item.bundle_price || 0);
    }

    res.json({ items: result.rows, total, count: result.rows.length });
  } catch (err) { next(err); }
};

// POST /api/cart — add item
const addToCart = async (req, res, next) => {
  try {
    const { course_id, bundle_id } = req.body;
    if (!course_id && !bundle_id) {
      return res.status(400).json({ error: 'course_id or bundle_id required' });
    }

    // Check if already enrolled (for courses)
    if (course_id) {
      const enrolled = await query(
        'SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND is_active = true',
        [req.user.user_id, course_id]
      );
      if (enrolled.rows.length) {
        return res.status(400).json({ error: 'أنت مسجل بالفعل في هذا الكورس' });
      }
    }

    const result = await query(
      `INSERT INTO cart_items (user_id, course_id, bundle_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, course_id) DO NOTHING
       RETURNING *`,
      [req.user.user_id, course_id || null, bundle_id || null]
    );

    res.status(201).json(result.rows[0] || { message: 'Already in cart' });
  } catch (err) { next(err); }
};

// DELETE /api/cart/:id — remove item
const removeFromCart = async (req, res, next) => {
  try {
    await query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.user_id]
    );
    res.json({ message: 'Removed from cart' });
  } catch (err) { next(err); }
};

// DELETE /api/cart — clear all
const clearCart = async (req, res, next) => {
  try {
    await query('DELETE FROM cart_items WHERE user_id = $1', [req.user.user_id]);
    res.json({ message: 'Cart cleared' });
  } catch (err) { next(err); }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart };
