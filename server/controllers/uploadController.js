const UPLOAD_DIR = require('path').join(__dirname, '..', 'uploads');

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
        const url = `${baseUrl}/uploads/${req.file.filename}`;
        res.json({ url });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { uploadFile };
