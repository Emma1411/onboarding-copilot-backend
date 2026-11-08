
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

function listMarkdownFiles(dir) {
  const out = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...listMarkdownFiles(full));
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      !entry.name.startsWith('_')
    ) {
      out.push(full);
    }
  }

  return out;
}

function titleFromContent(content) {
  const match = /^#\s+(.+)$/m.exec(content);
  return match ? match[1].trim() : null;
}

function toDateString(value) {
  if (!value) return null;

  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value);
}

// Génère un ID numérique depuis le nom du fichier ADR
function idFromFile(file) {
  const match = /(?:^|\/)(\d+)-[^/]*\.md$/.exec(file);
  return match ? Number(match[1]) : null;
}

function loadDocs(docsDir) {
  if (!fs.existsSync(docsDir)) return [];

  const root = path.dirname(docsDir);

  return listMarkdownFiles(docsDir).map((full) => {
    const { data, content } = matter(
      fs.readFileSync(full, 'utf8')
    );

    const file = path.relative(root, full)
      .split(path.sep)
      .join('/');

    return {
      file,

      kind: file.startsWith('docs/adr/')
        ? 'adr'
        : 'guide',

      meta: {
        id: data.id ?? idFromFile(file),

        title:
          data.title ||
          titleFromContent(content) ||
          path.basename(file, '.md'),

        status: data.status || null,

        date: toDateString(data.date),

        tags: Array.isArray(data.tags)
          ? data.tags
          : [],

        summary: data.summary || '',
      },

      content,
    };
  });
}

export { loadDocs };
