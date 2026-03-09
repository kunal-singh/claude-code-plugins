#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(PLUGIN_ROOT, 'docs');
const TEMPLATES = ['prd.md', 'architecture.md', 'review.md'];

function findProjectRoot(start) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, '.claude'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return start; // filesystem root — fallback
    dir = parent;
  }
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function defaultSlug() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    'session-' +
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    '-' +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

function loadIndex(indexPath) {
  if (!fs.existsSync(indexPath)) return { sessions: [] };
  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch {
    return { sessions: [] };
  }
}

function writeIndex(indexPath, data) {
  const tmp = indexPath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, indexPath);
}

function uniqueSlug(base, existingSlugs) {
  if (!existingSlugs.has(base)) return base;
  let n = 2;
  while (existingSlugs.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function main() {
  const rawName = process.argv.slice(2).join(' ').trim();
  const sessionName = rawName || null;
  const baseSlug = sessionName ? slugify(sessionName) || defaultSlug() : defaultSlug();
  const displayName = sessionName || baseSlug;

  const projectRoot = findProjectRoot(process.cwd());
  const sessionsDir = path.join(projectRoot, '.claude', 'team-sessions');
  const indexPath = path.join(sessionsDir, '.index.json');

  fs.mkdirSync(sessionsDir, { recursive: true });

  const index = loadIndex(indexPath);
  const existingSlugs = new Set(index.sessions.map((s) => s.slug));
  const slug = uniqueSlug(baseSlug, existingSlugs);
  const sessionDir = path.join(sessionsDir, slug);

  fs.mkdirSync(sessionDir, { recursive: true });

  const now = new Date().toISOString();

  for (const filename of TEMPLATES) {
    const template = fs.readFileSync(path.join(DOCS_DIR, filename), 'utf8');
    const content = template
      .replace(/\{\{SESSION_NAME\}\}/g, displayName)
      .replace(/\{\{CREATED_AT\}\}/g, now);
    fs.writeFileSync(path.join(sessionDir, filename), content, 'utf8');
  }

  index.sessions.push({
    name: displayName,
    slug,
    path: path.relative(projectRoot, sessionDir),
    createdAt: now,
    updatedAt: now,
  });

  writeIndex(indexPath, index);

  console.log(`Created session "${displayName}" at ${path.relative(projectRoot, sessionDir)}`);
}

main();
