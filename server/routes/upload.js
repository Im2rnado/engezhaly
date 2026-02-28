const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadFile } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '';
        const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').slice(0, 50);
        cb(null, `${base}-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = /\.(jpg|jpeg|png|gif|webp|pdf)$/i.test(file.originalname) || file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
        if (allowed) cb(null, true);
        else cb(new Error('Only images and PDFs are allowed'));
    }
});

const router = express.Router();
router.post('/', auth, upload.single('file'), uploadFile);
// Signup upload - no auth required (user not yet registered)
router.post('/signup', upload.single('file'), uploadFile);
module.exports = router;
