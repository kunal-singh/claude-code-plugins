#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function findProjectRoot(start) {
  let dir = start;
  while (true) {
    if (fs.existsSync(path.join(dir, '.claude'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null; // filesystem root reached
    dir = parent;
  }
}

function main() {
  const projectRoot = findProjectRoot(process.cwd());
  if (!projectRoot) {
    process.stderr.write('Error: No .claude/ directory found in any parent directory. Are you inside a Claude project?\n');
    process.exit(1);
  }

  const indexPath = path.join(projectRoot, '.claude', 'team-sessions', '.index.json');
  if (!fs.existsSync(indexPath)) {
    process.stderr.write(`Error: No session index found at ${indexPath}. Run /workflow:new-session first.\n`);
    process.exit(1);
  }

  let index;
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (err) {
    process.stderr.write(`Error: Failed to parse ${indexPath}: ${err.message}\n`);
    process.exit(1);
  }

  const active = (index.sessions || []).find((s) => s.isActive === true);
  if (!active) {
    process.stderr.write('Error: No active session found in .index.json. Activate a session first.\n');
    process.exit(1);
  }

  const sessionRoot = path.join(projectRoot, active.path);
  const prdPath = path.join(sessionRoot, 'prd.md');
  const archPath = path.join(sessionRoot, 'architecture.md');
  const reviewPath = path.join(sessionRoot, 'review.md');

  if (!fs.existsSync(archPath)) {
    process.stderr.write(`Error: architecture.md not found at ${archPath}. The session files may be missing.\n`);
    process.exit(1);
  }

  if (!fs.existsSync(reviewPath)) {
    process.stderr.write(`Error: review.md not found at ${reviewPath}. The session files may be missing.\n`);
    process.exit(1);
  }

  const result = {
    prd: fs.existsSync(prdPath) ? prdPath : null,
    architecture: archPath,
    review: reviewPath,
    sessionRoot,
  };

  process.stdout.write(JSON.stringify(result) + '\n');
}

main();
