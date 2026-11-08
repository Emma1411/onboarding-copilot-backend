const rateLimit = require('express-rate-limit');
const config = require('../config');

const perIp = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: config.limits.perHour,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      error: 'rate_limited',
      message: 'Limite atteinte pour cette heure. Réessaie plus tard.',
    }),
});

module.exports = { perIp };