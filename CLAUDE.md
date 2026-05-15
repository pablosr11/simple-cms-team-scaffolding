# Project conventions for Claude

## Ship one change at a time

Every individual change must be committed **and** deployed on its own — never
batch unrelated changes into one commit or one deploy. This keeps each change
independently revertable: a single `git revert <sha>` + redeploy rolls back
exactly one thing.

Workflow for each change:

1. Make the one change.
2. `pnpm typecheck && pnpm lint && pnpm test` — must be clean.
3. Commit it alone, with a message describing just that change.
4. `pnpm deploy`.
5. Only then start the next change.

If a task involves several changes, do them sequentially through the full
commit→deploy cycle, not as one bundle.
