---
name: tmux-capture
description: This skill should be used when the user asks to "capture pane", "capture tmux pane", "read pane output", "check pane 2", "get output from pane", "read the server pane", "capture terminal output", "look at what's in pane", or wants to inspect output from another tmux pane. Provides complete workflow for capturing tmux pane content and writing it to ~/tmux-logs/ for cross-pane access.
version: 1.0.0
user-invocable: false
---

# tmux-capture Skill

Capture the output of any tmux pane and write it to `~/tmux-logs/` so that a Claude Code session in one pane can read output from another pane (e.g. a dedicated app/server/test runner pane).

## Core Concepts

**Pane numbering**: tmux panes are 1-indexed in this plugin. Pane 1 is the first pane in the current window, pane 2 is the second, etc. Internally, `tmux capture-pane` uses 0-indexed `-t` targets, so subtract 1 when building the command (user says "pane 2" → use `-t 1`).

**Log location**: All captures are written to `~/tmux-logs/`. Create this directory if it does not exist.

**File naming format**:
```
~/tmux-logs/<timestamp>_pane<N>_<window-name>.txt
```
- `<timestamp>`: `YYYYMMDD_HHMMSS` (use `date +%Y%m%d_%H%M%S`)
- `<N>`: the 1-indexed pane number the user specified
- `<window-name>`: current tmux window name (use `tmux display-message -p '#W'`), with spaces replaced by underscores

Example filename: `20240315_143022_pane2_server.txt`

## Capture Workflow

### Step 1: Resolve the target pane

Convert the user-provided 1-indexed pane number to a 0-indexed tmux target:

```bash
PANE_NUM=2          # user-provided, 1-indexed
TARGET=$((PANE_NUM - 1))   # 0-indexed for tmux
```

### Step 2: Get the window name

```bash
WINDOW_NAME=$(tmux display-message -p '#W' | tr ' ' '_')
```

### Step 3: Build the output path

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/tmux-logs
OUTFILE=~/tmux-logs/${TIMESTAMP}_pane${PANE_NUM}_${WINDOW_NAME}.txt
```

### Step 4: Capture the pane

**Full scrollback (default)** — capture everything in the pane's scrollback buffer:

```bash
tmux capture-pane -t $TARGET -p -S - > "$OUTFILE"
```

The `-S -` flag tells tmux to start from the beginning of the scrollback buffer, capturing all history. `-p` prints to stdout.

**Limited capture (when user specifies line count)** — capture the last N lines:

```bash
LINES=500   # user-specified
tmux capture-pane -t $TARGET -p -S -$LINES > "$OUTFILE"
```

### Step 5: Report the result

After a successful capture, report:
- The file path written
- The line count: `wc -l < "$OUTFILE"`
- Offer to read/summarize the file if the user wants

Full one-liner for default full-scrollback capture:

```bash
PANE_NUM=2
TARGET=$((PANE_NUM - 1))
WINDOW_NAME=$(tmux display-message -p '#W' | tr ' ' '_')
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/tmux-logs
OUTFILE=~/tmux-logs/${TIMESTAMP}_pane${PANE_NUM}_${WINDOW_NAME}.txt
tmux capture-pane -t $TARGET -p -S - > "$OUTFILE"
echo "Captured to: $OUTFILE ($(wc -l < "$OUTFILE") lines)"
```

## Error Handling

**Pane does not exist**: If `tmux capture-pane` fails (exit code non-zero), report that pane N does not exist and list available panes:

```bash
tmux list-panes -F 'Pane #{pane_index} (1-indexed: #{e|+|:#{pane_index},1}): #{pane_current_command}'
```

**Not inside tmux**: If `$TMUX` is unset, inform the user that the session is not running inside tmux and this plugin requires a tmux session.

**Empty capture**: If the output file is 0 bytes, warn the user the pane may have no scrollback history.

## Reading a Captured Log

After capturing, read the log file with the Read tool using the full path reported. For large captures, read the tail end first (most recent output) using offset and limit parameters.

To find existing captures:

```bash
ls -lt ~/tmux-logs/ | head -20
```

## Common Usage Patterns

**Debugging a server pane**: App runs in pane 1, Claude develops in pane 2. User asks "check pane 1 for errors" → capture pane 1 → read the file → look for stack traces or error messages.

**Checking test output**: Tests run in pane 3 → capture pane 3 → read the file → report pass/fail and any failures.

**Reading build output**: Build runs in pane 2 → capture after build completes → parse for warnings or errors.

## Notes

- Log files are never auto-deleted. Clean up `~/tmux-logs/` manually when needed.
- The capture includes ANSI escape codes by default. If the file looks noisy, add `| sed 's/\x1b\[[0-9;]*m//g'` to strip color codes.
- Pane targets are relative to the current tmux session and window unless a full target (`session:window.pane`) is specified.
