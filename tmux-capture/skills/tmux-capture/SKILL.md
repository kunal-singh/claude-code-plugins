---
name: tmux-capture
description: This skill should be used when the user asks to "capture pane", "capture tmux pane", "read pane output", "check pane 2", "get output from pane", "read the server pane", "capture terminal output", "look at what's in pane", or wants to inspect output from another tmux pane. Captures tmux pane content and reads it inline — no file I/O required.
version: 1.1.0
user-invocable: false
---

# tmux-capture Skill

Capture the output of any tmux pane and read it inline. No files are written.

## Core Concepts

**Pane numbering**: Use tmux pane indices directly as the `-t` target. When the user says "pane 2", use `tmux capture-pane -t 2`. Do not subtract 1 — tmux pane indices match the numbers shown in `tmux list-panes` output and what users see with `Ctrl+b q`.

## Capture Command

**Full scrollback (default)**:
```bash
tmux capture-pane -t $PANE_NUM -p -S -
```

**Limited capture (when user specifies line count)**:
```bash
tmux capture-pane -t $PANE_NUM -p -S -$LINES
```

Read stdout directly — no file needed.

## Error Handling

**Pane does not exist**: If `tmux capture-pane` exits non-zero, report that pane N does not exist and list available panes:
```bash
tmux list-panes -F 'Pane #{pane_index}: #{pane_current_command}'
```

**Not inside tmux**: If `$TMUX` is unset, inform the user the session is not running inside tmux and this plugin requires a tmux session.

**Empty output**: If stdout is empty, warn the user the pane may have no scrollback history.

## Notes

- Output may contain ANSI escape codes. Strip with `| sed 's/\x1b\[[0-9;]*m//g'` if noisy.
- Pane targets are relative to the current tmux session and window unless a full target (`session:window.pane`) is specified.
