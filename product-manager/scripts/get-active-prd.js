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

  const prdPath = path.join(projectRoot, active.path, 'prd.md');
  if (!fs.existsSync(prdPath)) {
    process.stderr.write(`Error: prd.md not found at ${prdPath}. The session files may be missing.\n`);
    process.exit(1);
  }

  process.stdout.write(prdPath + '\n');
}

main();
