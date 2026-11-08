const MAX_CHARS = 1200;

// Découpe par titres (#, ##, ###) en ignorant les # dans les blocs de code
function splitSections(content) {
  const sections = [];
  let current = { heading: null, lines: [] };
  let inFence = false;

  for (const line of content.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = !inFence && /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) {
      sections.push(current);
      current = { heading: m[2], lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  sections.push(current);

  return sections
    .map((s) => ({ heading: s.heading, text: s.lines.join('\n').trim() }))
    .filter((s) => s.text);
}

// Une section trop longue est coupée par paragraphes
function splitLong(text) {
  if (text.length <= MAX_CHARS) return [text];
  const parts = [];
  let buf = '';
  for (const para of text.split(/\n\s*\n/)) {
    if (buf && buf.length + para.length + 2 > MAX_CHARS) {
      parts.push(buf);
      buf = '';
    }
    buf = buf ? `${buf}\n\n${para}` : para;
  }
  if (buf) parts.push(buf);
  return parts;
}

function chunkDocument(doc) {
  const chunks = [];
  let n = 0;
  for (const section of splitSections(doc.content)) {
    for (const piece of splitLong(section.text)) {
      chunks.push({
        id: `${doc.file}#${n++}`,
        file: doc.file,
        docTitle: doc.meta.title,
        heading: section.heading || 'Introduction',
        text: piece,
        tags: doc.meta.tags.join(' '),
      });
    }
  }
  return chunks;
}

module.exports = { chunkDocument };