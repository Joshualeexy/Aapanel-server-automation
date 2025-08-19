// db.js — Express mini router for database-related endpoints
const router = require('express').Router();
const { ap } = require('./aapanel'); // your aaPanel API helper
require('dotenv').config();

// Create a database
router.post('/create', async (req, res) => {
  try {
    const { name, user, password } = req.body;
    if (!name || !user || !password) {
      return res.status(400).json({ error: 'name, user, and password are required' });
    }

    // Call aaPanel to create the DB
    const resp = await ap('/database?action=AddDatabase', { 
      name,
      db_user: user,
      password,
      dataAccess: '127.0.0.1', // local access only (or 'ALL' for remote)
      ps: `DB for ${name}`
    });

    res.json({ ok: true, database: name, aapanel: resp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed to create database' });
  }
});

// You can add more DB routes here (delete, list, etc.)

module.exports = router;
