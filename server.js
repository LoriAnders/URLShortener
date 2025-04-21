require('dotenv').config();

const express = require('express');
const path = require('path');
const { nanoid } = require('nanoid');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const db = new Database();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/shorten', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        const shortCode = nanoid(8);
        
        await db.addUrl(url, shortCode);
        
        res.json({ 
            shortCode, 
            originalUrl: url,
            shortUrl: `${req.protocol}://${req.get('host')}/${shortCode}`
        });
    } catch (error) {
        console.error('Error shortening URL:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const urls = await db.getAllUrls();
        const totalUrls = urls.length;
        const totalClicks = urls.reduce((sum, url) => sum + url.click_count, 0);
        
        res.json({
            totalUrls,
            totalClicks,
            recentUrls: urls.slice(0, 10)
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/stats', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'stats.html'));
});

app.get('/:shortCode', async (req, res) => {
    try {
        const { shortCode } = req.params;
        
        if (shortCode === 'favicon.ico') {
            return res.status(404).end();
        }
        
        const urlData = await db.getUrl(shortCode);
        
        if (!urlData) {
            return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
        }

        await db.incrementClickCount(shortCode);
        
        res.redirect(urlData.original_url);
    } catch (error) {
        console.error('Error redirecting:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

db.init().then(() => {
    app.listen(PORT, () => {
        console.log(`URLShortener server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});