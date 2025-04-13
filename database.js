const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'urls.db');

class Database {
    constructor() {
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('Connected to SQLite database');
                this.createTables()
                    .then(() => resolve())
                    .catch(reject);
            });
        });
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const createUrlsTable = `
                CREATE TABLE IF NOT EXISTS urls (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    original_url TEXT NOT NULL,
                    short_code TEXT UNIQUE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    click_count INTEGER DEFAULT 0
                )
            `;

            this.db.run(createUrlsTable, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                console.log('URLs table created or exists');
                resolve();
            });
        });
    }

    addUrl(originalUrl, shortCode) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('INSERT INTO urls (original_url, short_code) VALUES (?, ?)');
            stmt.run([originalUrl, shortCode], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id: this.lastID, shortCode });
            });
            stmt.finalize();
        });
    }

    getUrl(shortCode) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('SELECT * FROM urls WHERE short_code = ?');
            stmt.get([shortCode], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
            stmt.finalize();
        });
    }

    incrementClickCount(shortCode) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare('UPDATE urls SET click_count = click_count + 1 WHERE short_code = ?');
            stmt.run([shortCode], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.changes);
            });
            stmt.finalize();
        });
    }

    getAllUrls() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM urls ORDER BY created_at DESC', (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = Database;