# tmux-capture

Capture tmux pane output into `~/tmux-logs/` so a Claude Code session in one pane can read and analyze output from another pane (e.g. a dedicated app server, test runner, or build pane).

## Use Case

Run your app in pane 1. Develop with Claude in pane 2. When you want Claude to inspect server logs or errors, just ask — no copy-pasting required.

## Features

- Capture any pane's full scrollback buffer (or last N lines)
- Files written to `~/tmux-logs/` with timestamp, pane number, and window name — no conflicts
- Slash command for explicit capture
- Skill teaches Claude to capture from natural language ("check pane 2 for errors")

## Installation

```bash
# From inside a Claude Code session
/plugin marketplace add kunalsingh/claude-code-plugins
```

Or test locally:

```bash
cc --plugin-dir /path/to/tmux-capture
```

## Usage

### Slash command

```
/tmux-capture:capture <pane-number> [lines]
```

Examples:
- `/tmux-capture:capture 2` — capture full scrollback of pane 2
- `/tmux-capture:capture 1 200` — capture last 200 lines of pane 1

### Natural language (via skill)

- "Capture pane 2"
- "Check what's in pane 1"
- "Read the server output from pane 3"
- "Get the last 500 lines from pane 2"

Claude will capture the pane, write the log file, and report the path.

## Log Files

Logs are written to `~/tmux-logs/` with the format:

```
~/tmux-logs/<YYYYMMDD_HHMMSS>_pane<N>_<window-name>.txt
```

Example: `~/tmux-logs/20240315_143022_pane2_server.txt`

Files are never auto-deleted. Clean up manually when needed.

## Requirements

- Must be running inside a tmux session
- `tmux` available in PATH
