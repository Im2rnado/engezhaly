const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const { list, addCard, remove, setDefault, initCharge } = require('../controllers/paymentMethodController');

router.get('/', authVerified, list);
router.post('/', authVerified, addCard);
router.post('/init-charge', authVerified, initCharge);
router.delete('/:id', authVerified, remove);
router.patch('/:id/default', authVerified, setDefault);

module.exports = router;
