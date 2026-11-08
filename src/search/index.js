const MiniSearch = require('minisearch');
const config = require('../config');
const { loadDocs } = require('./loader');
const { chunkDocument } = require('./chunker');

const STOPWORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'en', 'au', 'aux',
  'pour', 'par', 'sur', 'dans', 'que', 'qui', 'quoi', 'est', 'sont', 'ce', 'cette',
  'ces', 'il', 'elle', 'on', 'ne', 'pas', 'plus', 'se', 'sa', 'son', 'ses', 'mon',
  'ma', 'mes', 'ton', 'ta', 'tes', 'avec', 'sans', 'comment', 'pourquoi', 'quand',
  'quel', 'quelle', 'quels', 'quelles', 'a', 'd', 'l', 'qu', 'n', 's', 'c', 'j', 'm', 't',
  'y', 'plutot', 'moi', 'toi', 'lui', 'nous', 'vous', 'ils', 'elles', 'je', 'tu', 'me', 'te',
  'donne', 'donner', 'fait', 'faire', 'peut', 'peuvent', 'tout', 'tous', 'toute',
  'toutes', 'si', 'ca', 'cela', 'leur', 'leurs', 'car', 'mais', 'donc', 'alors',
  'tres', 'bien', 'etre', 'ete', 'ai', 'as', 'ont', 'avons', 'avez', 'the', 'is', 'of', 'to', 'and',
]);

// Minuscules, sans accents, pluriels simplifiés, mots vides supprimés.
// Appliqué à l'indexation ET à la recherche.
function processTerm(term) {
  let t = term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (STOPWORDS.has(t)) return null;
  if (t.length > 3 && t.endsWith('s')) t = t.slice(0, -1);
  return t;
}

let docs = [];
let miniSearch = null;

function buildIndex() {
  docs = loadDocs(config.docsDir);
  const chunks = docs.flatMap(chunkDocument);

  miniSearch = new MiniSearch({
    fields: ['docTitle', 'heading', 'text', 'tags'],
    storeFields: ['file', 'heading', 'text'],
    processTerm,
    searchOptions: {
      boost: { docTitle: 2, heading: 2, tags: 1.5 },
      // Préfixe et tolérance aux fautes uniquement sur les mots longs :
      // sur les mots courts, ils font matcher des mots sans rapport.
      prefix: (term) => term.length >= 6,
      fuzzy: (term) => (term.length >= 8 ? 1 : false),
    },
  });
  miniSearch.addAll(chunks);

  console.log(`Index : ${docs.length} documents, ${chunks.length} passages`);
}

function search(question, k = config.search.topK) {
  if (!miniSearch) return [];
  const results = miniSearch.search(question);
  if (results.length === 0) return [];

  // On coupe le bruit : garde uniquement ce qui est proche du meilleur score
  const top = results[0].score;
  return results
    .filter((r) => r.score >= top * 0.4)
    .slice(0, k)
    .map((r) => ({
      file: r.file,
      heading: r.heading,
      text: r.text,
      score: r.score,
      terms: r.terms,
    }));
}

function listAdrs() {
  return docs
    .filter((d) => d.kind === 'adr')
    .map((d) => ({ ...d.meta, file: d.file }))
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
}

function getAdr(id) {
  const doc = docs.find((d) => d.kind === 'adr' && d.meta.id === id);
  return doc ? { ...doc.meta, file: doc.file, content: doc.content } : null;
}

module.exports = { buildIndex, search, listAdrs, getAdr };