const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  getNotes, createNote, updateNote, deleteNote, getAllMyNotes,
  getBookmarks, addBookmark, deleteBookmark, getAllMyBookmarks,
} = require('../controllers/notesController');

// Notes
router.get('/my-all',               authenticate, getAllMyNotes);
router.get('/lesson/:lessonId',     authenticate, getNotes);
router.post('/lesson/:lessonId',    authenticate, createNote);
router.put('/:id',                  authenticate, updateNote);
router.delete('/:id',              authenticate, deleteNote);

// Bookmarks
router.get('/bookmarks/my-all',              authenticate, getAllMyBookmarks);
router.get('/bookmarks/lesson/:lessonId',    authenticate, getBookmarks);
router.post('/bookmarks/lesson/:lessonId',   authenticate, addBookmark);
router.delete('/bookmarks/:id',             authenticate, deleteBookmark);

module.exports = router;
