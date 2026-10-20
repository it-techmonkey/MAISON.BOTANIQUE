# Local workspace and recovery

The canonical storefront stays at `Flower Business/maison-botanique-repo/`. Surrounding business files are
local and not part of the public Git repository.

| Workspace path | Purpose |
| --- | --- |
| `worktrees/bikanervala-diwali-proposal/` | Preserved unfinished proposal; reconcile separately |
| `business/brand/`, `business/campaigns/` | Brand decisions, campaign tooling and hand-off files |
| `private/research/`, `private/sales/`, `private/customers/` | Restricted source data and analysis |
| `private/secrets/` | Credentials and preserved environments |
| `media/originals/`, `media/generated/`, `media/approved/` | Original media, generation evidence, approved assets |
| `review/<project>/<date>/` | Decisions, reports and browser evidence |
| `archive/` | Frozen local repositories, prototypes, historical tools and exports |
| `private/backups/workspace-organization-2026-10-19/` | Sensitive recovery snapshot; never upload |

## Connect image working data

From the repository root in this workspace:

```sh
python3 -I scripts/setup-workspace.py \
  --data-dir ../media/generated/image-pipeline \
  --refs-dir ../private/research/supplier-images \
  --diwali-refs-dir ../private/research/diwali-refs \
  --secrets-file ../private/secrets/image-pipeline.env
```

Creates ignored relative links for out/qa/jobs/references and the existing key file. Refuses to overwrite
directories or differently targeted links. No API calls. In a standalone clone, omit all arguments for
ignored `.local/image-pipeline` storage and supply provider keys through environment variables.
Python image tools need Pillow/requests; Diwali label placement also uses numpy/scipy. These are tooling
dependencies, not storefront build dependencies.

Run pipeline commands from catalog/image-pipeline; out paths retain their meaning. Campaign jobs are under
diwali/jobs. The archived original pipeline is recovery material, not a second maintained source.

## Recovery

The snapshot preserves ignored media/credentials and complete Git directories, excluding rebuildable caches
and dependencies. All 10,310 regular files were hash-checked, five representative files restored and compared,
and four Git bundles verified. It is local only, not an off-device backup or Shopify export.

Restore into a NEW empty directory first. Read the snapshot's local README/manifest; never unpack over the
active workspace. Linked-worktree metadata has original paths; use Git-aware repair or recreate a worktree
from preserved history. Recovery access is restricted to the workspace owner.

Pre-cleanup deployment edits are retained in a named stash and snapshot. Original branch tips have local
archive tags; the alternate Claude implementation is preserved rather than merged over newer code.
Claude Maison skill entries link to their maintained .agents equivalents; CLAUDE.md links to AGENTS.md.
The Playwright capture alias points into dated review evidence for tool compatibility.
