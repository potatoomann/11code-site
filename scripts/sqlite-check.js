
const Database = require('better-sqlite3');

try {
    const db = new Database('dev.db', { verbose: console.log });
    console.log("Database opened successfully.");

    const stmt = db.prepare('SELECT name FROM sqlite_master WHERE type="table" LIMIT 5');
    const tables = stmt.all();

    console.log("Tables found:", tables);

    if (tables.length > 0) {
        console.log("Database seems healthy and populated.");
    } else {
        console.log("Database is empty (no tables).");
    }

    const userCount = db.prepare('SELECT count(*) as count FROM User').get();
    console.log(`User count: ${userCount.count}`);

    db.close();
} catch (err) {
    console.error("Database check failed:", err);
}
