const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { listEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/calendarController');

router.get('/', authenticate, listEvents);
router.post('/', authenticate, createEvent);
router.put('/:id', authenticate, updateEvent);
router.delete('/:id', authenticate, deleteEvent);

module.exports = router;
