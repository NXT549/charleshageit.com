# CLAUDE.md

Project instructions for Claude Code. The canonical, tool-agnostic orientation lives in AGENTS.md and
is imported below, so start there instead of re-reading the codebase.

@AGENTS.md

## Claude-specific notes

- Read [DESIGN.md](DESIGN.md) before touching the data flow (`showcase/`, `src/lib/showcase.ts`),
  styling, the social card or the sketchbook.
- Follow [WORKFLOW.md](WORKFLOW.md) for the change loop and recipes, and update its
  "Where things stand" section when you finish a session.
- Before every push: `npm run check`, `node --test "showcase/test/*.test.mjs"` and
  `SHOWCASE_OFFLINE=1 npm run build`.
- Never put a location (city, region, country, timezone) in anything you write, including commit
  messages and PR descriptions.
- Show screenshots before committing to a new visual direction.
- If you change structure, commands, a contract or a rule, update AGENTS.md / DESIGN.md /
  WORKFLOW.md / README.md in the same commit. Keep them short; delete stale lines.
