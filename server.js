const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { ADMIN_TOKEN } = process.env;

const dns = require('./dns');
const site = require('./site');
const mail = require('./mail');
const db = require('./db');
const health = require('./health');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-admin-token']
}));
app.use(express.json());

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Protect all /api routes
app.use('/api', (req, res, next) => {
  if (req.headers['x-admin-token'] !== ADMIN_TOKEN)
    return res.status(401).json({ error: 'unauthorized' });
  next();
});

// Mount micro routes
app.use('/api/dns', dns);
app.use('/api/site', site);
app.use('/api/mail', mail);
app.use('/api/db', db);
app.use('/api/health', health);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API + index.html on :${PORT}`));
