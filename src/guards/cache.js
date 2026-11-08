const TTL_MS = 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;
const store = new Map();

function normalize(q) {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function get(question) {
  const key = normalize(question);
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

function set(question, value) {
  if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value);
  store.set(normalize(question), { at: Date.now(), value });
}

module.exports = { get, set };