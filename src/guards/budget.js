const config = require('../config');

let day = new Date().toISOString().slice(0, 10);
let used = 0;

function roll() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    used = 0;
  }
}

function available() {
  if (!config.ai.enabled || !config.ai.apiKey) return false;
  roll();
  return used < config.ai.dailyTokenCap;
}

function record(tokens) {
  roll();
  used += tokens || 0;
}

function stats() {
  roll();
  return { day, used, cap: config.ai.dailyTokenCap };
}

module.exports = { available, record, stats };