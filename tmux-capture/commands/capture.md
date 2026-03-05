---
name: capture
description: Capture the output of a tmux pane and write it to ~/tmux-logs/ for reading in this Claude session. Usage: /tmux-capture:capture <pane-number> [lines]
argument-hint: "<pane-number> [lines]"
allowed-tools:
  - Bash
  - Read
---

Capture the output of tmux pane `$ARGUMENTS` and write it to `~/tmux-logs/`.

## Argument Parsing

Parse `$ARGUMENTS` as:
- First token: pane number (1-indexed, required)
- Second token: line count (optional, integer — how many lines from scrollback to capture)

If no arguments provided, ask the user: "Which pane number do you want to capture?"

## Execution

Run the following bash, substituting parsed values:

```bash
PANE_NUM=<pane-number>
TARGET=$((PANE_NUM - 1))
WINDOW_NAME=$(tmux display-message -p '#W' | tr ' ' '_')
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/tmux-logs
OUTFILE=~/tmux-logs/${TIMESTAMP}_pane${PANE_NUM}_${WINDOW_NAME}.txt

# Full scrollback (default) or limited if line count provided
if [ -n "<lines>" ]; then
  tmux capture-pane -t $TARGET -p -S -<lines> > "$OUTFILE"
else
  tmux capture-pane -t $TARGET -p -S - > "$OUTFILE"
fi

LINE_COUNT=$(wc -l < "$OUTFILE")
echo "FILE=$OUTFILE"
echo "LINES=$LINE_COUNT"
```

## After Capture

Report to the user:
- The full path of the written file
- The line count
- Example: "Captured pane 2 → `~/tmux-logs/20240315_143022_pane2_server.txt` (342 lines)"

Do NOT automatically read or summarize the file. Let the user ask if they want the contents analyzed.

## Error Cases

- If `tmux capture-pane` exits non-zero: report pane N does not exist, then run `tmux list-panes -F 'Pane #{e|+|:#{pane_index},1}: #{pane_current_command}'` and show available panes.
- If `$TMUX` is unset (not inside tmux): inform the user and stop.
- If output file is 0 bytes: warn that the pane has no scrollback content.
