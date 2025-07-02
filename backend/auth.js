require('dotenv').config(); // Neu: Laden der Umgebungsvariablen
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const Joi = require('joi'); // Neuer Schritt: Inputvalidierung (z. B. Joi) vor Registration und Login

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
        return res.status(400).send('Ungültige Eingaben.');
    }

    const { username, password, email } = req.body;

    const userData = loadUserData();
    const existingUser = userData.users.find(
        (user) => user.username === username || user.email === email
    );
    if (existingUser) {
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
    res.status(201).send('Benutzer erfolgreich registriert.');
}

async function loginUser(req, res) {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).send(`Ungültige Eingabedaten: ${error.details[0].message}`);
    }

    const { username, password } = req.body;
    const userData = loadUserData();

    const user = userData.users.find((user) => user.username === username);
    if (!user) {
        return res.status(404).send('Benutzer nicht gefunden.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
        return res.status(401).send('Falsches Passwort.');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_KEY || 'default_secret_key', { expiresIn: '1h' });
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
    

    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {

        return res.status(401).send('Nicht autorisiert. Token fehlt oder ungültig.');
    }

    const token = authHeader.split(' ')[1];


    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'default_secret_key');

        req.user = decoded;
        next();
    } catch (err) {
        
        return res.status(403).send('Ungültiges oder abgelaufenes Token.');
    }
}

module.exports = { registerUser, loginUser, checkAuth };
