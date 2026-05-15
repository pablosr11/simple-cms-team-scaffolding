# Receipt / Invoice Tracker — Scaffolding

Multi-tenant CMS where team members upload receipts, an AI extracts structured
data (vendor, date, totals, payer, line items), and entries land in a per-team
tracker. This is a runnable base scaffold, not a finished product.

## Stack

- **Next.js 16** (App Router, TypeScript strict) + Tailwind v4 + shadcn/ui
- **Supabase** — Postgres + Auth (email magic link), RLS-enforced multi-tenancy
- **Cloudflare Workers** via the OpenNext adapter (`@opennextjs/cloudflare`)
- **Cloudflare R2** — receipt file storage
- **OpenRouter** — AI extraction, model swappable via one env var
- **pnpm**, **vitest**

## Architecture decisions

- **Multi-tenant.** `organizations` + `organization_members`; receipts scoped
  to `org_id`. RLS allows access only to members (`is_org_member()` is
  `SECURITY DEFINER` to avoid recursive policies on `organization_members`).
- **Pluggable AI.** Everything goes through `ReceiptExtractor`
  (`src/lib/extraction/`). The only implementation calls OpenRouter via the
  Vercel AI SDK; switch models with `OPENROUTER_MODEL`, or add a provider in
  `src/lib/extraction/index.ts`.
- **R2 via Worker binding** (`RECEIPTS_BUCKET`), server-side upload through the
  route handler — no S3 presigned credentials needed at this stage.
- **Sync now, async-ready.** `processReceipt()` (`src/lib/services/`) does
  upload→extract→persist inline. `receipts.status`
  (`uploaded|processing|extracted|failed`) already models the async lifecycle,
  so moving the body to a Cloudflare Queue consumer later needs no schema
  change.
- **No Next middleware.** Next 16 runs `proxy`/middleware only on the Node
  runtime, which OpenNext/Cloudflare does not support. Auth is enforced
  server-side via `requireUser()` (`src/lib/auth.ts`) at the top of every
  protected layout/page. Trade-off: no automatic access-token refresh on
  expiry mid-browsing (re-login resolves it). Re-enable middleware if OpenNext
  gains Next 16 proxy support.

## Prerequisites

- Node 22+, pnpm (`corepack enable`)
- Docker (for local Supabase)
- Supabase CLI, Wrangler (bundled as a dev dep), a Cloudflare account

## Local setup

```bash
pnpm install

# 1. Local Supabase (needs Docker) — applies the migration on reset
supabase start
supabase db reset            # runs supabase/migrations/*.sql
supabase status              # copy API URL + anon key

# 2. Env files
cp .env.example .env.local       # fill NEXT_PUBLIC_SUPABASE_* + OPENROUTER_*
cp .dev.vars.example .dev.vars   # same values for the Cloudflare runtime

# 3. R2 buckets (once, against your Cloudflare account)
pnpm exec wrangler r2 bucket create simple-cms-receipts
pnpm exec wrangler r2 bucket create simple-cms-receipts-preview

# 4. Run
pnpm dev
```

**Magic-link email template:** in Supabase Auth → Email Templates → Magic Link,
set the link to:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

Locally, magic-link emails are captured by Inbucket at
`http://localhost:54324`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Next dev server (Cloudflare bindings via OpenNext dev) |
| `pnpm build` | Next production build |
| `pnpm preview` | OpenNext build + run on the Workers runtime locally |
| `pnpm deploy` | OpenNext build + deploy to Cloudflare |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm cf-typegen` | Regenerate `cloudflare-env.d.ts` after editing `wrangler.jsonc` |

## Deploy (Cloudflare)

1. Set `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
   `OPENROUTER_MODEL` in `wrangler.jsonc` `vars` (NEXT_PUBLIC_* are inlined at
   build time).
2. Set the secret: `pnpm exec wrangler secret put OPENROUTER_API_KEY`.
3. Ensure the R2 buckets exist (see setup).
4. `pnpm deploy`.
5. Point your hosted Supabase project's Auth redirect URLs and the magic-link
   email template at the deployed origin.

## Verification

- `pnpm dev` + local Supabase: sign in via magic link (Inbucket), create a
  team, upload a sample receipt image; confirm extracted fields + line items
  render and are editable, and `receipts.status` reaches `extracted`.
- RLS: a second user in another org cannot see the first org's receipts.
- `pnpm preview`: repeat the upload flow against the Workers runtime with the
  R2 binding before deploying.
- `pnpm typecheck && pnpm lint && pnpm test` all clean.

## Deferred (intentionally out of scope)

Cloudflare Queues async migration, browser presigned R2 uploads, OAuth/extra
auth methods, billing/quotas, multi-currency normalization, receipt dedupe,
exports/reporting, E2E tests.
