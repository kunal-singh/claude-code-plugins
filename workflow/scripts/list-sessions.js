#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function findProjectRoot(start) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, '.claude'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

function loadIndex(indexPath) {
  if (!fs.existsSync(indexPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch {
    return null;
  }
}

function formatDate(iso) {
  return iso.replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

function pad(str, len) {
  return String(str).padEnd(len);
}

function main() {
  const projectRoot = findProjectRoot(process.cwd());
  const indexPath = path.join(projectRoot, '.claude', 'team-sessions', '.index.json');

  const index = loadIndex(indexPath);
  if (!index || index.sessions.length === 0) {
    console.log('No sessions found.');
    process.exit(0);
  }

  const sorted = [...index.sessions].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const slugWidth = Math.max(4, ...sorted.map((s) => s.slug.length)) + 2;
  const nameWidth = Math.max(4, ...sorted.map((s) => s.name.length)) + 2;

  console.log(
    pad('CREATED (UTC)', 22) + pad('SLUG', slugWidth) + 'NAME'
  );
  console.log('-'.repeat(22 + slugWidth + nameWidth));

  for (const s of sorted) {
    console.log(
      pad(formatDate(s.createdAt), 22) +
      pad(s.slug, slugWidth) +
      s.name
    );
  }
}

main();
