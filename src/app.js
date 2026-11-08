const express = require('express');
const cors = require('cors');
const config = require('./config');
const healthRoute = require('./routes/health');
const askRoute = require('./routes/ask');
const docsRoute = require('./routes/docs');

const app = express();

// Derrière le proxy de Render : sans ça, toutes les IP semblent identiques
app.set('trust proxy', 1);

app.use(cors({ origin: config.frontOrigin }));
app.use(express.json({ limit: '10kb' }));

app.use('/api/health', healthRoute);
app.use('/api/ask', askRoute);
app.use('/api/docs', docsRoute);

app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'server_error' : 'bad_request' });
});

module.exports = app;