const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '/data/logs/Server log.txt');

console.log('Log-Dateipfad:', logFilePath);

// Sicherstellen, dass das Log-Verzeichnis existiert
if (!fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${message}\n`;

    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Fehler beim Schreiben ins Log:', err.message);
        }
    });
}

module.exports = { writeLog };
