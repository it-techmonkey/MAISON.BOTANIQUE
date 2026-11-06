# Maison business workspace — design checkpoint

**Start with [the version gallery](index.html).** The latest proposal is
[Business / My day / Reference](current/index.html).

This checkpoint preserves the work from the design conversation: five interface iterations, the business problem,
owner feedback, the proposed technical direction and the remaining validation. It does not implement a shared app.

## Continue from here

1. Read [current status](CURRENT_STATUS.md) and [decisions and feedback](DECISIONS.md).
2. Open the latest preview and test the blocker → owner → next-action route without coaching.
3. Confirm or revise the navigation before implementing the [technical plan](IMPLEMENTATION_PLAN.md).
4. Record each meaningful change in [CHANGELOG.md](CHANGELOG.md), update status and checks, then commit it on this branch.
5. Never silently overwrite a historical version. Add a history snapshot when a direction materially changes.

## Preview locally

The HTML pages are standalone and need no build, accounts, API keys or network requests.
Open `index.html` in a browser, or serve this folder locally:

```sh
python3 -m http.server 8041 --bind 127.0.0.1 --directory prototypes/business-workspace
```

Open `http://127.0.0.1:8041/`. Stop the server when finished. This is a local review, not a production route.

## What is preserved

| Version | Purpose | Disposition |
| --- | --- | --- |
| [Department overview](history/01-department-overview/index.html) | Goal strip and seven department blocks | Historical; insufficient structural change |
| [Founder’s briefing](history/02-founders-briefing/index.html) | Decision-led opening and department drill-down | Historical exploration |
| [Claude reference](history/03-claude-reference/index.html) | Compact paper/wine briefing with a dark next-action panel | Owner-preferred visual reference; older workflow examples |
| [Dense workbench](history/04-dense-workbench/index.html) | Board with an adjacent knowledge/evidence panel | Rejected as crowded and confusing |
| [Simplified navigation](current/index.html) | Business overview → department → task, with My day and Reference | Latest recommendation; not yet approved |

Exact, unredacted original fragments are preserved locally under ignored `.local/originals/`, with a SHA-256
manifest at `.local/manifest.json`. They are **not** in the remote backup. The committed review copies use
fictional names, source references and demonstration content because this repository is public.
Private business datasets, raw conversations, real outreach records and internal commercial plans are excluded.

## Verification

```sh
node --test prototypes/business-workspace/tests/archive.test.cjs
node prototypes/business-workspace/scripts/check-preview.cjs
```

The second command requires Playwright. Set `PLAYWRIGHT_MODULE` to an existing Playwright module if it is
provided by your environment rather than installed in this repository. No package dependency was added for this archive.
Screenshots default to the ignored `qa/screenshots/` folder. The summary is written to `qa/latest.json`.

The current preview is English-only. Arabic, shared editing, permissions, persistence, source access and production
behavior are not implemented or verified. Historical prototypes retain historical usability limitations.
