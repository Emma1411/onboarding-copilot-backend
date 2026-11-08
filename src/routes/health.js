const express = require('express');
const budget = require('../guards/budget');

const router = express.Router();

// `ai` permet au front d'afficher le bandeau "IA en pause" dès le chargement
router.get('/', (req, res) => {
  res.json({ ok: true, ai: budget.available() });
});

module.exports = router;