---
name: capture
description: Capture the output of a tmux pane and read it inline. Usage: /tmux-capture:capture <pane-number> [lines]
argument-hint: "<pane-number> [lines]"
allowed-tools:
  - Bash
---

Capture the output of tmux pane `$ARGUMENTS` and read it inline.

## Argument Parsing

Parse `$ARGUMENTS` as:
- First token: pane number (required)
- Second token: line count (optional — how many lines from scrollback to capture)

If no arguments provided, ask the user: "Which pane number do you want to capture?"

## Execution

**Guard**: If `$TMUX` is unset, inform the user this plugin requires a tmux session and stop.

Run one bash call:

```bash
PANE_NUM=<pane-number>

if [ -n "<lines>" ]; then
  tmux capture-pane -t $PANE_NUM -p -S -<lines>
else
  tmux capture-pane -t $PANE_NUM -p -S -
fi
```

Read the stdout directly. Do not write any files.

## After Capture

Report the captured output inline. If the output is large, summarize and highlight key content (errors, warnings, recent activity).

## Error Cases

- If `tmux capture-pane` exits non-zero: report pane N does not exist, then run `tmux list-panes -F 'Pane #{pane_index}: #{pane_current_command}'` and show available panes.
- If `$TMUX` is unset: inform the user and stop.
- If output is empty: warn that the pane has no scrollback content.
