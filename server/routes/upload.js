const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed =
            /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(file.originalname) ||
            file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/x-pdf';
        if (allowed) cb(null, true);
        else cb(new Error('Only images and PDFs are allowed'));
    }
});

const router = express.Router();
router.post('/', auth, upload.single('file'), uploadFile);
// Signup upload - no auth required (user not yet registered)
router.post('/signup', upload.single('file'), uploadFile);
module.exports = router;
