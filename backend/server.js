const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    exposedHeaders: ['Content-Disposition']
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => {
    console.log(`[DEBUG] ${req.method} ${req.url}`);
    next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const reportsRoutes = require('./routes/reports');
const imagesRoutes = require('./routes/images');
const authRoutes = require('./routes/auth');

app.use('/api/reports', reportsRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Quality Report Tamto API is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} [VERSION: DEBUG-V2-50MB]`);
});
