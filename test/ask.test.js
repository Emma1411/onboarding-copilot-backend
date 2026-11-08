// Variables posées AVANT de charger l'app : dotenv n'écrase pas une variable déjà définie.
process.env.NODE_ENV = 'test';
process.env.AI_ENABLED = 'true';
process.env.DEEPSEEK_API_KEY = 'cle-de-test';
process.env.MIN_SCORE = '6.5';
process.env.RATE_LIMIT_PER_HOUR = '1000';
process.env.DAILY_TOKEN_CAP = '250';

const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

// L'appel à DeepSeek est simulé : aucun test ne consomme de token.
const deepseek = require('../src/llm/deepseek');
let llmCalls = 0;
let llm = async () => ({ answer: 'Réponse de test [1]', usage: { total_tokens: 100 } });
mock.method(deepseek, 'ask', async (args) => {
  llmCalls += 1;
  return llm(args);
});

// Doit être chargé APRÈS le mock : routes/ask.js capture `ask` au chargement.
const app = require('../src/app');
const { buildIndex } = require('../src/search');
buildIndex();

const ask = (question) => request(app).post('/api/ask').send({ question });

test('GET /api/health indique que l\'IA est disponible', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { ok: true, ai: true });
});

test('question pertinente : mode ai, citations et bonne source en premier', async () => {
  const res = await ask('Comment la clé API est-elle protégée ?');
  assert.equal(res.status, 200);
  assert.equal(res.body.mode, 'ai');
  assert.match(res.body.answer, /\[1\]/);
  assert.equal(res.body.sources[0].file, 'docs/adr/0004-protection-cle-api.md');
  assert.equal(llmCalls, 1);
});

test('même question reformulée : servie par le cache, sans appel IA', async () => {
  const before = llmCalls;
  const res = await ask('COMMENT LA CLÉ API EST-ELLE PROTÉGÉE');
  assert.equal(res.body.cached, true);
  assert.equal(res.body.mode, 'ai');
  assert.equal(llmCalls, before);
});

test('question hors-sujet : no_answer, sans source et sans appel IA', async () => {
  const before = llmCalls;
  const res = await ask('Quelle est la capitale de la France ?');
  assert.equal(res.status, 200);
  assert.equal(res.body.mode, 'no_answer');
  assert.deepEqual(res.body.sources, []);
  assert.equal(llmCalls, before);
});

test('question trop courte : 400', async () => {
  const res = await ask('ab');
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'question_too_short');
});

test('corps invalide : 400', async () => {
  assert.equal((await ask(123)).status, 400);
  assert.equal((await request(app).post('/api/ask').send({})).status, 400);
});

test('erreur DeepSeek : repli sur le mode sources_only', async () => {
  const previous = llm;
  llm = async () => {
    throw new Error('panne simulée');
  };
  try {
    const res = await ask("Pourquoi il n'y a pas de base de données ?");
    assert.equal(res.status, 200);
    assert.equal(res.body.mode, 'sources_only');
    assert.equal(res.body.answer, null);
    assert.equal(res.body.sources[0].file, 'docs/adr/0001-pas-de-base-de-donnees.md');
  } finally {
    llm = previous;
  }
});

test('GET /api/docs liste les ADR triés, sans leur contenu', async () => {
  const res = await request(app).get('/api/docs');
  assert.equal(res.status, 200);
  assert.ok(res.body.length >= 6);
  const ids = res.body.map((d) => d.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => a - b));
  for (const d of res.body) {
    assert.ok(d.title);
    assert.equal(d.content, undefined);
  }
});

test('GET /api/docs/:id renvoie le détail, ou 404', async () => {
  const ok = await request(app).get('/api/docs/4');
  assert.equal(ok.status, 200);
  assert.match(ok.body.content, /## Décision/);
  assert.equal((await request(app).get('/api/docs/999')).status, 404);
  assert.equal((await request(app).get('/api/docs/abc')).status, 404);
});

test('route inconnue sous /api : 404 JSON', async () => {
  const res = await request(app).get('/api/inexistant');
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'not_found');
});

// Ce test est le dernier : il consomme le budget, donc il change l'état global.
test('budget quotidien épuisé : sources_only sans appel IA', async () => {
  for (const q of ['Comment fonctionne le cache ?', "Pourquoi pas d'authentification ?"]) {
    assert.equal((await ask(q)).body.mode, 'ai');
  }
  const before = llmCalls;
  const res = await ask('Que se passe-t-il quand le budget IA est épuisé ?');
  assert.equal(res.body.mode, 'sources_only');
  assert.equal(res.body.answer, null);
  assert.ok(res.body.sources.length > 0);
  assert.equal(llmCalls, before);
});