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

function main() {
  const query = process.argv.slice(2).join(' ').trim().toLowerCase();

  const projectRoot = findProjectRoot(process.cwd());
  const indexPath = path.join(projectRoot, '.claude', 'team-sessions', '.index.json');

  const index = loadIndex(indexPath);
  if (!index || index.sessions.length === 0) process.exit(0);

  const matches = index.sessions.filter(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      s.slug.toLowerCase().includes(query)
  );

  for (const s of matches) {
    // Tab-separated: absolute path \t name — Claude parses the path to read files
    console.log(path.join(projectRoot, s.path) + '\t' + s.name);
  }

  process.exit(0);
}

main();
