const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed =
            /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i.test(file.originalname) ||
            file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/x-pdf' ||
            (file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
            file.mimetype.startsWith('audio/') ||
            file.mimetype === 'audio/mpeg' ||
            file.mimetype === 'audio/mp3' ||
            file.mimetype === 'audio/webm' ||
            file.mimetype === 'audio/ogg' ||
            file.mimetype === 'audio/wav' ||
            file.mimetype === 'audio/mp4';
        if (allowed) cb(null, true);
        else cb(new Error('Only images, PDFs, DOC/DOCX, and audio files are allowed'));
    }
});

const router = express.Router();
router.post('/', auth, upload.single('file'), uploadFile);
// Signup upload - no auth required (user not yet registered)
router.post('/signup', upload.single('file'), uploadFile);
module.exports = router;
