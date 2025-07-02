// server.js

require('dotenv').config();
const express      = require('express');
const fs           = require('fs');
const path         = require('path');
const bodyParser   = require('body-parser');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const Joi          = require('joi');
const { registerUser, loginUser, checkAuth } = require('./auth');

// Einfacher Middleware-Ersatz f\xC3\xBCr "cookie-parser"
function parseCookies(req, res, next) {
  req.cookies = {};
  const raw = req.headers.cookie;
  if (raw) {
    raw.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts.shift().trim();
      const value = decodeURIComponent(parts.join('=') || '');
      req.cookies[name] = value;
    });
  }
  next();
}

const app = express();

// --- Middlewares ---
app.use(cors());
app.options('*', cors());
app.use(bodyParser.json());
app.use(parseCookies);
app.use(helmet());
// 100 Requests pro 15 Minuten
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- Data setup ---
const dataPath   = path.join(__dirname, 'hardware_db.json');
const idFilePath = path.join(__dirname, 'ID.txt');

function loadData() {
  if (fs.existsSync(dataPath)) {
    try {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
      return [];
    }
  }
  return [];
}

function saveData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  } catch (err) {
  }
}

let items = loadData();

// --- Validation schema ---
const hardwareSchema = Joi.object({
  id:        Joi.number().optional(),
  name:      Joi.string().min(3).required(),
  typ:       Joi.string().min(3).required(),
  status:    Joi.string().valid('Zugewiesen', 'Defekt', 'Auf Lager').required(),
  standort:  Joi.string().required(),
  abteilung: Joi.string().required(),
  person:    Joi.string().required(),
  preis:     Joi.number().greater(0).required(),
});

// --- Routes ---

// Get all items
app.get('/items', checkAuth, (req, res) => {
  res.json(items);
});

// Create a new hardware object
app.post('/save-object', checkAuth, (req, res) => {
  const { error } = hardwareSchema.validate(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const newItem = { ...req.body, preis: parseFloat(req.body.preis) };
  const newId   = getLastId() + 1;
  newItem.id    = newId;
  saveLastId(newId);

  items.push(newItem);
  saveData(items);

  res.status(201).json(newItem);
});

// Get details of one item
app.get('/details/:id', checkAuth, (req, res) => {
  const id   = parseInt(req.params.id, 10);
  const item = items.find(e => e.id === id);

  if (item) {
    res.json(item);
  } else {
    res.status(404).send('Objekt nicht gefunden');
  }
});

// Delete one item
app.delete('/details/:id', checkAuth, (req, res) => {
  const id    = parseInt(req.params.id, 10);
  const index = items.findIndex(e => e.id === id);

  if (index !== -1) {
    items.splice(index, 1);
    saveData(items);
    res.json({ message: `Objekt mit ID ${id} gelöscht.` });
  } else {
    res.status(404).send('Objekt nicht gefunden');
  }
});

// ID helper functions
function getLastId() {
  try {
    if (fs.existsSync(idFilePath)) {
      return parseInt(fs.readFileSync(idFilePath, 'utf8'), 10) || 0;
    }
  } catch (err) {
  }
  return 0;
}

function saveLastId(id) {
  try {
    fs.writeFileSync(idFilePath, id.toString(), 'utf8');
  } catch (err) {
  }
}

// Generate a new ID without saving an object
app.get('/generate-id', (req, res) => {
  const newId = getLastId() + 1;
  saveLastId(newId);
  res.json({ id: newId });
});

// --- Auth endpoints ---
app.post('/register', registerUser);
app.post('/login',    loginUser);

// --- Token verification route ---
app.get('/verify-token', checkAuth, (req, res) => {
  // Wenn checkAuth durchläuft, ist der Token gültig
  res.sendStatus(204);
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

// --- Server start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT);
