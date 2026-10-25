# Business workspace design checkpoint

Read README.md, CURRENT_STATUS.md, DECISIONS.md and IMPLEMENTATION_PLAN.md before continuing.

- This folder contains design prototypes, not a working shared business application.
- The latest simplified layout is a proposal awaiting usability feedback, not an approved build specification.
- Keep historical versions. Update the status, decision record, changelog and checks with each meaningful iteration.
- The repository is public. All committed fixtures must be fictional. Never add real customer data, outreach histories,
  financial inputs, internal commercial plans, secrets, absolute owner-machine paths or raw chat exports.
- Exact originals are retained under ignored `.local/`; those files are local-only and must not be force-added.
- Never treat demo data as the business source of truth or replace live records from it.
- No shared backend, authentication, integrations, scheduled jobs or paid service is approved by this checkpoint.
- Use task branches. Main/production changes require separate owner approval.
- This archive is outside `src/` and `public/`. Do not expose it through the storefront as part of a checkpoint.
- Run `node --test prototypes/business-workspace/tests/archive.test.cjs` after edits.
- For UI changes, also run `scripts/check-preview.cjs` with Playwright available, then record results in `qa/latest.json`.
- Before writing Next.js application code, read the repository instructions and installed Next.js documentation.
