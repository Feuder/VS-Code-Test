require('dotenv').config(); // Neu: Laden der Umgebungsvariablen
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const Joi = require('joi'); // Neuer Schritt: Inputvalidierung (z. B. Joi) vor Registration und Login
const { writeLog } = require('./logger');
const { timeStamp } = require('console');
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';
const usersDataPath = path.join(__dirname, 'data', 'users_db.json');

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

function loadUserData() {
    if (fs.existsSync(usersDataPath)) {
        return JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
    }
    return { users: [] };
}

function saveUserData(data) {
    fs.writeFileSync(usersDataPath, JSON.stringify(data, null, 2));
}

async function registerUser(req, res) {
    const schema = Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
        email: Joi.string().email().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        writeLog(`Registrierung fehlgeschlagen: Ungültige Eingaben - ${error.message}`);
        return res.status(400).send('Ungültige Eingaben.');
    }

    const { username, password, email } = req.body;

    const userData = loadUserData();
    const existingUser = userData.users.find(
        (user) => user.username === username || user.email === email
    );
    if (existingUser) {
        writeLog(`Registrierung fehlgeschlagen: Benutzername/E-Mail bereits vergeben - ${username}`);
        return res.status(409).send('Benutzername oder E-Mail bereits vergeben.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        id: require('uuid').v4(),
        username,
        password: hashedPassword,
        email,
        role: 'user',
        created_at: new Date().toISOString(),
    };

    userData.users.push(newUser);
    saveUserData(userData);
    writeLog(`Benutzer registriert: ${username}`);
    res.status(201).send('Benutzer erfolgreich registriert.');
}

async function loginUser(req, res) {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        writeLog(`Login fehlgeschlagen: ungültige Eingabedaten - ${error.details[0].message}`);
        return res.status(400).send(`Ungültige Eingabedaten: ${error.details[0].message}`);
    }

    const { username, password } = req.body;
    const userData = loadUserData();

    const user = userData.users.find((user) => user.username === username);
    if (!user) {
        writeLog(`Login fehlgeschlagen: Benutzer nicht gefunden - ${username}`);
        return res.status(404).send('Benutzer nicht gefunden.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        writeLog(`Login fehlgeschlagen: Falsches Passwort - ${username}`);
        return res.status(401).send('Falsches Passwort.');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY || 'default_secret_key', { expiresIn: '1h' });
    writeLog(`Login erfolgreich: ${username}`);
    res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    });
    res.json({ message: 'Login erfolgreich.', token });
}

function checkAuth(req, res, next) {
    let authHeader = req.headers['authorization'];
    if (!authHeader && req.cookies && req.cookies.token) {
         authHeader = 'Bearer ' + req.cookies.token;
    }
    
    console.log(timeStamp(), 'Erhaltener Auth Header:', authHeader); 
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Fehler: Kein Auth-Header oder falsches Format');
        return res.status(401).send('Nicht autorisiert. Token fehlt oder ungültig.');
    }

    const token = authHeader.split(' ')[1];
    console.log('Extrahiertes Token:', token);

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'default_secret_key');
        console.log('Token erfolgreich verifiziert:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        writeLog(`Token ungültig oder abgelaufen: ${err.message}`);
        console.log('Token ungültig oder abgelaufen:', err.message);
        return res.status(403).send('Ungültiges oder abgelaufenes Token.');
    }
}

module.exports = { registerUser, loginUser, checkAuth };
