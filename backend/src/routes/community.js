const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

// ─── GET posts feed ──────────────────────────────────────
router.get('/posts', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT p.*, u.name AS user_name, u.avatar_url,
              EXISTS(SELECT 1 FROM community_likes l WHERE l.post_id = p.id AND l.user_id = $1) AS liked_by_me
       FROM community_posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.user_id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── CREATE post ─────────────────────────────────────────
router.post('/posts', authenticate, async (req, res, next) => {
  try {
    const { content, image_url } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const result = await query(
      `INSERT INTO community_posts (user_id, content, image_url) VALUES ($1,$2,$3) RETURNING *`,
      [req.user.user_id, content.trim(), image_url || null]
    );
    const post = result.rows[0];
    // Return with user info
    const full = await query(
      `SELECT p.*, u.name AS user_name, u.avatar_url, false AS liked_by_me FROM community_posts p JOIN users u ON u.id = p.user_id WHERE p.id = $1`,
      [post.id]
    );
    res.status(201).json(full.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE post (owner or admin) ────────────────────────
router.delete('/posts/:id', authenticate, async (req, res, next) => {
  try {
    const condition = req.user.role === 'admin' ? 'id = $1' : 'id = $1 AND user_id = $2';
    const params = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.user_id];
    await query(`DELETE FROM community_posts WHERE ${condition}`, params);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// ─── LIKE / UNLIKE ───────────────────────────────────────
router.post('/posts/:id/like', authenticate, async (req, res, next) => {
  try {
    const existing = await query('SELECT 1 FROM community_likes WHERE post_id=$1 AND user_id=$2', [req.params.id, req.user.user_id]);
    if (existing.rows.length) {
      await query('DELETE FROM community_likes WHERE post_id=$1 AND user_id=$2', [req.params.id, req.user.user_id]);
      await query('UPDATE community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id=$1', [req.params.id]);
      res.json({ liked: false });
    } else {
      await query('INSERT INTO community_likes (post_id, user_id) VALUES ($1,$2)', [req.params.id, req.user.user_id]);
      await query('UPDATE community_posts SET likes_count = likes_count + 1 WHERE id=$1', [req.params.id]);
      res.json({ liked: true });
    }
  } catch (err) { next(err); }
});

// ─── GET comments ────────────────────────────────────────
router.get('/posts/:id/comments', authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, u.name AS user_name, u.avatar_url FROM community_comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── ADD comment ─────────────────────────────────────────
router.post('/posts/:id/comments', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content required' });
    const result = await query(
      `INSERT INTO community_comments (post_id, user_id, content) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.user_id, content.trim()]
    );
    await query('UPDATE community_posts SET comments_count = comments_count + 1 WHERE id=$1', [req.params.id]);
    const full = await query(
      `SELECT c.*, u.name AS user_name, u.avatar_url FROM community_comments c JOIN users u ON u.id = c.user_id WHERE c.id = $1`,
      [result.rows[0].id]
    );
    res.status(201).json(full.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE comment ──────────────────────────────────────
router.delete('/posts/:postId/comments/:id', authenticate, async (req, res, next) => {
  try {
    const condition = req.user.role === 'admin' ? 'id=$1' : 'id=$1 AND user_id=$2';
    const params = req.user.role === 'admin' ? [req.params.id] : [req.params.id, req.user.user_id];
    await query(`DELETE FROM community_comments WHERE ${condition}`, params);
    await query('UPDATE community_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id=$1', [req.params.postId]);
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

// ─── PIN post (admin) ────────────────────────────────────
router.put('/posts/:id/pin', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const result = await query('UPDATE community_posts SET is_pinned = NOT is_pinned WHERE id=$1 RETURNING *', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
