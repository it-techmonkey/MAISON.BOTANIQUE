# Branch retirement — 19 October 2026

Cleanup baseline is origin/main `8ae247f` (PR #3 included). No local or remote main update is part of cleanup.
Local main remains at `7b3199b`; use origin/main when starting work. Branch tips are retained by local
archive/2026-10-19 tags and a verified pre-cleanup Git bundle in restricted workspace recovery storage.

| Original branch/checkpoint | Commit | Treatment |
| --- | --- | --- |
| catalog-pipeline | bfe7af5 | Ancestor of main; retired |
| codex/editorial-storefront-preview | 82945e7 | Ancestor of main; retired |
| collection-page | 4a394a7 | Ancestor of main; deployment edits retained in stash/snapshot |
| feature/nextjs-shopify | 0a40f9f | Ancestor of main; remote branch can retire |
| design-merge | 12b5476 | Merged through PR #2; clean worktree retired |
| live-fixes | 781266f | Merged through PR #3; retained by archive tag |
| mb-preview checkpoint | 7f3658f | Ancestor of main; detached preview retired |
| design-merge-claude | 8f9f5f1 | Two unique commits preserved by tag/bundle; alternate worktree retired |
| codex/bikanervala-diwali-proposal | 5d942df | Unfinished changes preserved in active relocated worktree |

The alternate Claude commits are `8353e45` (Gifts for her) and `8f9f5f1` (welcome codes). Current main has
the reviewed Gifts for her selection (`39566b0`) and personalized-code implementation (`d42fc1b` plus later
fixes). Main subsequently replaced standalone occasion pages with filters in PR #3. The old offer branch
stored contact data in browser localStorage; main uses the encrypted contact session and offer-cart endpoint.
These are alternate implementations, not a clean set of missing patches. Do not merge the older branch over
main. Its original source remains recoverable. Existing tests verify current offer behavior; live redemption
and shipping still require separate configuration/testing.

The Bikanervala worktree moved with Git, retaining its full tracked/untracked status and unchanged file
hashes. Its misleading origin/main upstream was removed. No proposal commit, merge, publication or new
image spending is included. Standalone legacy repositories retain their histories and original dirty status.
