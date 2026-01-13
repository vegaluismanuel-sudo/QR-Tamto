const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Ensure dir exists or create it? (Better to create in server loop or rely on it existing)
        // We already do 'mkdir uploads' in task list? No, I should create it.
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the path relative to server
    // We serve /uploads static at /uploads
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ filePath });
});

module.exports = router;
