const express = require('express');
const router = express.Router();
const authVerified = require('../middleware/authVerified');
const { list, add, remove, setDefault } = require('../controllers/withdrawalMethodController');

router.get('/', authVerified, list);
router.post('/', authVerified, add);
router.delete('/:id', authVerified, remove);
router.patch('/:id/default', authVerified, setDefault);

module.exports = router;
