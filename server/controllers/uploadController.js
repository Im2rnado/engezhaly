const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const sanitizeBase = (name) => {
    return ((name || 'file').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'file');
};

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
        const timestamp = Date.now();
        const isImage = req.file.mimetype.startsWith('image/');

        let filename;

        if (isImage) {
            try {
                const buffer = await sharp(req.file.buffer)
                    .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 90 })
                    .toBuffer();

                const base = path.basename(req.file.originalname, path.extname(req.file.originalname) || '');
                filename = `${sanitizeBase(base)}-${timestamp}.jpg`;
                const filepath = path.join(UPLOAD_DIR, filename);
                fs.writeFileSync(filepath, buffer);
            } catch (err) {
                console.error('[Upload] Sharp failed:', err.message);
                return res.status(400).json({ message: 'Failed to process image. Please ensure it is a valid image file.' });
            }
        } else {
            const ext = path.extname(req.file.originalname) || '.pdf';
            const base = path.basename(req.file.originalname, ext);
            filename = `${sanitizeBase(base)}-${timestamp}${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);
            fs.writeFileSync(filepath, req.file.buffer);
        }

        const url = `${baseUrl}/uploads/${filename}`;
        res.json({ url });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { uploadFile };
