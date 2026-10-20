# Development and review

1. Read repository instructions/current status and the workspace AGENTS.md if present.
2. Check git status/worktrees, active chats and previews. Fetch origin and branch from fresh origin/main.
   Do not reset another task's work or change local main during cleanup.
3. Use the canonical checkout if free; otherwise create an isolated worktree under workspace `worktrees/`.
4. Keep one branch per task. Do not build new work on archived Sites projects or old Vite branches.
5. Read matching Next.js guides in node_modules/next/dist/docs before writing Next.js code.
6. Stage only your files; inspect behavior changes, generated artifacts and secrets.

## Checks

Run npm test, Python unittest discovery, npm run typecheck, then npm run build (commands in README).
Typecheck generates Next.js route helpers first, so it also works in a fresh clone without a previous build.
CI uses the lockfile, pinned official Actions, read-only repository permissions and no Shopify credentials.
Installation scripts are disabled; enable a specific dependency's install step only after a concrete review.

Visible storefront changes also need English/Arabic, reduced motion, buying flow and browser checks at
1440, 414, 390, 360 and 320px. Organization-only changes should preserve src, public, next.config.ts and
commerce behavior; compare against the baseline rather than regenerating assets or redesigning.

## Publication

The approved cleanup may be published as a review branch and draft PR; production merge is separate.
Branch pushes may create protected Vercel previews. Use techmonkeys-projects / maison-botanique through
GitHub; do not deploy with the old laptop .vercel link. Report preview limitations. Shopify writes, DNS,
production configuration and paid image calls are outside cleanup.

## Main protection — administrator action

Require PRs and block force pushes/deletion, including administrators where supported. After CI runs,
select the actual successful check name in GitHub. The connected account has write, not admin access;
workflow preparation is not proof of branch protection. Plan support needs administrator verification.
Repository visibility stays unchanged; do not add private business data to the public repo.
