const BASE = process.env.API || 'http://localhost:3000';

// [question, fichier attendu en première source]
const relevant = [
  ['Pourquoi une recherche par mots-clés plutôt qu\'une base vectorielle ?', '0003'],
  ['Comment la clé API est-elle protégée ?', '0004'],
  ['Que se passe-t-il quand le budget IA est épuisé ?', ['0005', '0006']],
  ['Pourquoi il n\'y a pas de base de données ?', '0001'],
  ['Comment fonctionne le cache ?', '0005'],
  ['Pourquoi pas d\'authentification ?', '0002'],
];

const offTopic = [
  'Quelle est la capitale de la France ?',
  'Donne-moi une recette de tarte aux pommes',
  'Qui a gagné la coupe du monde ?',
  'Écris-moi un poème sur la mer',
];

async function ask(question) {
  const res = await fetch(`${BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  return res.json();
}

(async () => {
  const rows = [];

  for (const [question, expected] of relevant) {
    const r = await ask(question);
    const first = r.sources?.[0]?.file ?? '-';
    rows.push({
      groupe: 'pertinente',
      question: question.slice(0, 45),
      mode: r.mode,
      score: r.debug?.topScore?.toFixed(2),
      source1: first.replace('docs/', ''),
      ok: [].concat(expected).some((e) => first.includes(e)) ? 'OK' : 'KO',
      termes: (r.debug?.terms ?? []).join(',').slice(0, 40),
    });
  }

  for (const question of offTopic) {
    const r = await ask(question);
    rows.push({
      groupe: 'hors-sujet',
      question: question.slice(0, 45),
      mode: r.mode,
      score: r.debug?.topScore?.toFixed(2),
      source1: r.sources?.[0]?.file?.replace('docs/', '') ?? '-',
      ok: r.mode === 'no_answer' ? 'OK' : 'KO',
      termes: (r.debug?.terms ?? []).join(',').slice(0, 40),
    });
  }

  console.table(rows);

  const high = (g, fn) => Math.max(...rows.filter((r) => r.groupe === g).map((r) => Number(r.score)));
  const low = (g) => Math.min(...rows.filter((r) => r.groupe === g).map((r) => Number(r.score)));
  console.log(`Score max hors-sujet   : ${high('hors-sujet')}`);
  console.log(`Score min pertinentes  : ${low('pertinente')}`);
  console.log('MIN_SCORE doit être entre ces deux valeurs.');
})();