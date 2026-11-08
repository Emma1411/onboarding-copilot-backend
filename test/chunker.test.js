const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chunkDocument } = require('../src/search/chunker');

const FENCE = '`'.repeat(3);

function makeDoc(content) {
  return {
    file: 'docs/adr/0001-test.md',
    meta: { title: 'Titre du doc', tags: ['a', 'b'] },
    content,
  };
}

test('découpe par titres et garde le titre de chaque section', () => {
  const chunks = chunkDocument(makeDoc('## Contexte\nTexte un.\n\n## Décision\nTexte deux.'));
  assert.equal(chunks.length, 2);
  assert.deepEqual(chunks.map((c) => c.heading), ['Contexte', 'Décision']);
  assert.equal(chunks[0].text, 'Texte un.');
});

test('le texte avant le premier titre devient "Introduction"', () => {
  const chunks = chunkDocument(makeDoc('Du texte sans titre.\n\n## Suite\nAutre texte.'));
  assert.deepEqual(chunks.map((c) => c.heading), ['Introduction', 'Suite']);
});

test('ignore les sections vides', () => {
  const chunks = chunkDocument(makeDoc('## Vide\n\n## Plein\nContenu.'));
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].heading, 'Plein');
});

test('ignore les # à l\'intérieur des blocs de code', () => {
  const content = [
    '## Exemple',
    `${FENCE}bash`,
    '# commentaire shell',
    'npm start',
    FENCE,
    'Fin.',
  ].join('\n');
  const chunks = chunkDocument(makeDoc(content));
  assert.equal(chunks.length, 1);
  assert.match(chunks[0].text, /# commentaire shell/);
});

test('coupe une section trop longue par paragraphes', () => {
  const paragraphs = Array.from({ length: 5 }, () => 'x'.repeat(400));
  const chunks = chunkDocument(makeDoc(`## Long\n${paragraphs.join('\n\n')}`));
  assert.ok(chunks.length > 1);
  for (const c of chunks) assert.ok(c.text.length <= 1200);
});

test('chaque passage porte le titre du document, les tags et un id unique', () => {
  const chunks = chunkDocument(makeDoc('## A\nun\n\n## B\ndeux\n\n## C\ntrois'));
  assert.equal(new Set(chunks.map((c) => c.id)).size, chunks.length);
  for (const c of chunks) {
    assert.equal(c.docTitle, 'Titre du doc');
    assert.equal(c.tags, 'a b');
    assert.equal(c.file, 'docs/adr/0001-test.md');
  }
});