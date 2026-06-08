const express = require('express');
const multer = require('multer');
const { uploadFile, uploadSecureFile } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowedExts = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|mp3|mpeg|webm|ogg|wav|mp4)$/i;
        const hasAllowedExt = allowedExts.test(file.originalname);

        const isAllowedMime =
            file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/x-pdf' ||
            file.mimetype === 'application/msword' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype.startsWith('audio/') ||
            file.mimetype === 'video/mp4';

        if (hasAllowedExt && isAllowedMime) cb(null, true);
        else cb(new Error('Only images, PDFs, DOC/DOCX, and audio files with valid extensions are allowed'));
    }
});

/** Chat attachments only: PDF + images, max 10MB (same limit as general upload). */
const chatUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedExts = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
        const hasAllowedExt = allowedExts.test(file.originalname);

        const ok =
            file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/x-pdf';
        if (hasAllowedExt && ok) cb(null, true);
        else cb(new Error('Chat attachments must be a PDF or image with a valid extension'));
    }
});

const router = express.Router();
router.post('/', auth, upload.single('file'), uploadFile);
router.post('/secure', auth, upload.single('file'), uploadSecureFile);
router.post('/chat', auth, chatUpload.single('file'), uploadFile);
// Signup upload - no auth required (user not yet registered)
router.post('/signup', upload.single('file'), uploadFile);
router.post('/signup-secure', upload.single('file'), uploadSecureFile);
module.exports = router;
