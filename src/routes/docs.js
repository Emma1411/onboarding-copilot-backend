const express = require('express');
const { listAdrs, getAdr } = require('../search');

const router = express.Router();

router.get('/', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(listAdrs());
});

router.get('/:id', (req, res) => {
  const adr = getAdr(Number(req.params.id));
  if (!adr) return res.status(404).json({ error: 'not_found' });
  res.set('Cache-Control', 'public, max-age=300');
  res.json(adr);
});

module.exports = router;