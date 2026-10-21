# GitHub CI and Vercel delivery

GitHub runs `.github/workflows/checks.yml`; Vercel handles previews and production
through its existing GitHub integration. No Vercel token or Shopify credential is
needed in GitHub Actions. Do not add a second deployment workflow or use the old
local `.vercel` project link.

## Automated checks

PRs targeting `main`, pushes to `main`, merge-queue groups and manual workflow runs
run the `Storefront checks` workflow. Its required check is `verify`; keep that job
name unique and stable in both GitHub and Vercel settings.

The job uses Node 24, Python 3.12, the npm lockfile and pinned official Actions.
It installs with lifecycle scripts disabled, runs Node/Python tests and TypeScript
checks, validates recorded prices, builds Next.js, then runs the existing Chromium
buying-flow tests against that build. Browser reports are retained for seven days.
New PR commits cancel outdated PR runs. Main runs are not cancelled by newer
commits, so each production commit can report its own result.

The existing `e2e-preview.yml` separately exercises successful Vercel Preview
deployments. `live-check.yml` is a manual production check. Keep `verify` as the
required merge/release gate: deployment-status workflows can be skipped on
non-preview events and do not replace an always-triggered PR/main check.

CI uses the bundled preview catalogue without commerce credentials. A pass does
not verify live Shopify inventory, discounts, payment, webhook delivery or the real
WhatsApp connection. Browser tests annotate the live checks they cannot exercise.
Never copy `.env.local` into CI, commit credentials, or run catalogue seeding here.

## GitHub administrator setup

After this review branch has a successful PR run:

1. Open repository **Settings > Branches** and create or update protection for
   `main` (or apply equivalent rules in the existing ruleset).
2. Require pull requests and at least one approving review. Dismiss stale approvals
   when new commits are pushed and require review conversations to be resolved.
3. Require status checks and an up-to-date branch. Select the actual successful
   `verify` check from GitHub Actions; confirm it belongs to `Storefront checks`.
4. Apply the rules to administrators where supported, with no routine bypasses.
   Leave force pushes and branch deletion disabled.
5. Confirm the rule is active and supported by the repository's plan/visibility.
   Do not change visibility. A committed workflow does not enforce these settings.

Owner approval to merge into production remains a separate requirement. Do not
merge the CI setup PR just to make the checks appear; a PR run is sufficient.

## Vercel project setup

Use **techmonkeys-projects / maison-botanique**. Verify the connected repository is
`it-techmonkey/MAISON.BOTANIQUE`, project root is the repository root, framework is
Next.js and production branch is `main`. Use Node 24 to match CI, install command
`npm ci --ignore-scripts`, build command `npm run build`, and the framework's
default output directory. Confirm Python 3 is available for the price prebuild.

Review existing Preview and Production environment variables against `.env.example`
and `docs/SHOPIFY_SETUP.md` without copying them into GitHub. Keep production secrets
scoped to Production; use separately approved preview settings. Keep
`SITE_INDEXABLE=false` on previews; production indexing is an independent owner
decision. Broad Shopify catalogue/admin authorization stays local. The limited
server-side tokens documented for runtime features belong only in approved host
environments.

In **Settings > Deployment Checks**, add **GitHub** as the provider and select the
successful `verify` check from `Storefront checks`. Confirm automatic production
aliasing is enabled in the Production environment. Vercel will build main commits
but hold assignment to production domains until the selected commit check passes.
Keep the existing preview deployment integration enabled. No `repository_dispatch`
workflow or additional status-writing permission is needed for these triggers.

Reference: [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks).
If the check cannot be selected or gating is unavailable, resolve that before
claiming the release pipeline is enforced. Do not fall back to ungated production
deployments or use Force Promote as the routine release path.

## Acceptance and release

1. Open a review PR and confirm `verify` runs, including browser tests. Check the
   browser report for failures and annotations about unavailable live features.
2. Confirm Vercel posts a protected preview URL to the PR; review English/Arabic
   and the buying flow there. Live checkout/payment acceptance remains separate.
3. Confirm the active GitHub rule blocks merging a failing or pending check.
4. Confirm Vercel lists `verify` as a required production Deployment Check.
5. Obtain explicit owner approval before merging. On that approved release, verify
   the same main commit passes GitHub CI before Vercel assigns production domains.

Before step 5, the repository changes can be reviewed and tested without a
production deployment. Live GitHub rules, Vercel settings and end-to-end production
gating must be verified in their respective services; this document is not evidence
that they have been enabled.
