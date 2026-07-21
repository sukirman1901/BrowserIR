#!/usr/bin/env bash
# SessionStart hook for BrowserIR plugin

set -euo pipefail

# Determine plugin root directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read BrowserIR skill content
bir_skill_content=$(cat "${PLUGIN_ROOT}/skills/bir/SKILL.md" 2>&1 || echo "Error reading BrowserIR skill")

# Escape string for JSON embedding using bash parameter substitution.
escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

bir_skill_escaped=$(escape_for_json "$bir_skill_content")
session_context="<EXTREMELY_IMPORTANT>\nYou have BROWSERIR SUPERPOWERS.\n\n**IMPORTANT: The BrowserIR skill content is included below. It is ALREADY LOADED - you are currently following it.**\n\n${bir_skill_escaped}\n</EXTREMELY_IMPORTANT>"

# Output context injection as JSON.
# Platform-specific output format detection.
if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  # Cursor: additional_context (snake_case)
  printf '{\n  "additional_context": "%s"\n}\n' "$session_context" | cat
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -z "${COPILOT_CLI:-}" ]; then
  # Claude Code: hookSpecificOutput.additionalContext
  printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context" | cat
else
  # Copilot CLI or unknown platform: additionalContext (SDK standard)
  printf '{\n  "additionalContext": "%s"\n}\n' "$session_context" | cat
fi

exit 0
