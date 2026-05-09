const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const c = require('../controllers/certificateController');

router.get('/verify/:serial', c.verifyBySerial); // public verification
router.post('/issue', authenticate, c.issueCertificate);
router.get('/my', authenticate, c.myCertificates);
router.get('/:id', authenticate, c.getCertificate);

module.exports = router;
