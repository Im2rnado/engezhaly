const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const SECURE_UPLOAD_DIR = path.join(__dirname, '..', 'secure_uploads');

const sanitizeBase = (name) => {
    return ((name || 'file').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'file');
};

const handleUpload = async (req, res, isSecure = false) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const targetDir = isSecure ? SECURE_UPLOAD_DIR : UPLOAD_DIR;
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
        const timestamp = Date.now();
        const isImage = req.file.mimetype.startsWith('image/');

        let filename;

        if (isImage) {
            try {
                const metadata = await sharp(req.file.buffer).metadata();
                const isPng = req.file.mimetype === 'image/png';
                const isWebp = req.file.mimetype === 'image/webp';
                
                let pipeline = sharp(req.file.buffer)
                    .resize(3840, 3840, { // Increase to 4K for banners
                        fit: 'inside',
                        withoutEnlargement: true,
                        kernel: sharp.kernel.lanczos3 // High quality scaling
                    });

                let processedBuffer;
                const base = path.basename(req.file.originalname, path.extname(req.file.originalname) || '');

                if (isPng) {
                    processedBuffer = await pipeline
                        .png({ quality: 100, compressionLevel: 9, adaptiveFiltering: true })
                        .toBuffer();
                    filename = `${sanitizeBase(base)}-${timestamp}.png`;
                } else if (isWebp) {
                    processedBuffer = await pipeline
                        .webp({ quality: 95, lossless: false, effort: 6 })
                        .toBuffer();
                    filename = `${sanitizeBase(base)}-${timestamp}.webp`;
                } else {
                    processedBuffer = await pipeline
                        .jpeg({ 
                            quality: 95, 
                            progressive: true, 
                            chromaSubsampling: '4:4:4', 
                            trellisQuantisation: true,
                            overshootDeringing: true,
                            optimizeScans: true
                        })
                        .toBuffer();
                    filename = `${sanitizeBase(base)}-${timestamp}.jpg`;
                }

                const filepath = path.join(targetDir, filename);
                fs.writeFileSync(filepath, processedBuffer);
            } catch (err) {
                console.error('[Upload] Sharp failed:', err.message);
                return res.status(400).json({ message: 'Failed to process image. Please ensure it is a valid image file.' });
            }
        } else {
            const isAudio = req.file.mimetype.startsWith('audio/');
            const fallbackExt = isAudio ? '.webm' : '.pdf';
            const ext = path.extname(req.file.originalname).toLowerCase() || fallbackExt;
            const allowedExts = ['.pdf', '.doc', '.docx', '.mp3', '.mpeg', '.webm', '.ogg', '.wav', '.mp4'];
            const safeExt = allowedExts.includes(ext) ? ext : '.bin';
            const base = path.basename(req.file.originalname, ext);
            filename = `${sanitizeBase(base)}-${timestamp}${safeExt}`;
            const filepath = path.join(targetDir, filename);
            fs.writeFileSync(filepath, req.file.buffer);
        }

        const urlPrefix = isSecure ? '/secure-uploads/' : '/uploads/';
        const url = `${baseUrl}${urlPrefix}${filename}`;
        res.json({ url });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const uploadFile = (req, res) => handleUpload(req, res, false);
const uploadSecureFile = (req, res) => handleUpload(req, res, true);

module.exports = { uploadFile, uploadSecureFile };
