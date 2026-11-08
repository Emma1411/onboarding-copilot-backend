const { test } = require('node:test');
const assert = require('node:assert/strict');
const cache = require('../src/guards/cache');

test('renvoie null quand la question est inconnue', () => {
  assert.equal(cache.get('une question jamais posee'), null);
});

test('renvoie la valeur stockée', () => {
  cache.set('Pourquoi ce choix ?', { answer: 'parce que' });
  assert.deepEqual(cache.get('Pourquoi ce choix ?'), { answer: 'parce que' });
});

test('ignore la casse, les accents, la ponctuation et les espaces en trop', () => {
  cache.set('Comment la clé API est protégée ?', { answer: 'ok' });
  assert.deepEqual(cache.get('  comment LA cle api est   protegee '), { answer: 'ok' });
});

test('expire après 24 heures', (t) => {
  t.mock.timers.enable({ apis: ['Date'] });
  cache.set('question qui expire', { answer: 'temporaire' });
  assert.ok(cache.get('question qui expire'));
  t.mock.timers.tick(24 * 60 * 60 * 1000 + 1000);
  assert.equal(cache.get('question qui expire'), null);
});

test('limite le cache à 500 entrées en supprimant les plus anciennes', () => {
  for (let i = 0; i < 501; i++) cache.set(`question numero ${i}`, { i });
  assert.equal(cache.get('question numero 0'), null);
  assert.deepEqual(cache.get('question numero 500'), { i: 500 });
});