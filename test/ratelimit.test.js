process.env.NODE_ENV = 'test';
process.env.AI_ENABLED = 'false';
process.env.DEEPSEEK_API_KEY = '';
process.env.MIN_SCORE = '6.5';
process.env.RATE_LIMIT_PER_HOUR = '2';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { buildIndex } = require('../src/search');
buildIndex();

test('la 3e requête de la même IP dans l\'heure reçoit un 429', async () => {
  const send = () =>
    request(app).post('/api/ask').send({ question: 'Quelle est la capitale de la France ?' });

  assert.equal((await send()).status, 200);
  assert.equal((await send()).status, 200);

  const res = await send();
  assert.equal(res.status, 429);
  assert.equal(res.body.error, 'rate_limited');
});