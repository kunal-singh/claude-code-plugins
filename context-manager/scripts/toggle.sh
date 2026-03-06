#!/usr/bin/env bash
# Usage: toggle.sh <selected_items_comma_separated> <item1> <item2> ...
# Presents a gum checklist with pre-selected items and outputs the user's selection.
# First arg: comma-separated list of currently-enabled items (for --selected)
# Remaining args: all available items

set -euo pipefail

SELECTED="$1"
shift
ITEMS=("$@")

gum choose --no-limit \
  --header "Toggle items (SPACE = toggle, ENTER = confirm, ESC = cancel):" \
  --selected="$SELECTED" \
  "${ITEMS[@]}"
