#!/usr/bin/env bash
# Runs once when the dev container is created.
set -euo pipefail

# Tools: Claude Code CLI (for the terminal) and a static file server
npm install -g @anthropic-ai/claude-code serve

# Skip Claude Code permission prompts — INSIDE THIS CONTAINER ONLY.
# The settings live in the container's config volume, so the Windows host
# keeps its normal prompts. Existing settings are merged, not replaced.
CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
mkdir -p "$CONFIG_DIR"
node - "$CONFIG_DIR/settings.json" <<'JS'
const fs = require('fs');
const file = process.argv[2];
let settings = {};
try { settings = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { /* new file */ }
settings.permissions = Object.assign({}, settings.permissions, { defaultMode: 'bypassPermissions' });
fs.writeFileSync(file, JSON.stringify(settings, null, 2) + '\n');
console.log('Claude Code: bypassPermissions enabled in', file);
JS
