const path = require('path');
require('dotenv').config();

const num = (value, fallback) =>
  value === undefined || value === '' ? fallback : Number(value);

module.exports = {
  port: num(process.env.PORT, 3000),
  frontOrigin: process.env.FRONT_ORIGIN || 'https://onboarding-copilot-front.vercel.app',
  docsDir: path.join(__dirname, '..', 'docs'),

  ai: {
    enabled: process.env.AI_ENABLED !== 'false',
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com',
    maxTokens: num(process.env.AI_MAX_TOKENS, 3000),
    dailyTokenCap: num(process.env.DAILY_TOKEN_CAP, 300000),
  },

  limits: {
    perHour: num(process.env.RATE_LIMIT_PER_HOUR, 15),
    questionMin: 5,
    questionMax: 300,
  },

  search: {
    minScore: num(process.env.MIN_SCORE, 3),
    topK: num(process.env.TOP_K, 5),
  },
};