# Proposed implementation sequence

Status: recommendation only; no backend, accounts or paid services provisioned.

## 1. Validate the workflow

Use the latest standalone prototype with both intended owners. Ask each to locate a blocker, identify its owner,
open the next step, return to the originating department and locate an earlier decision. Do not coach navigation.
Revise before adding features if the route is unclear. Keep department and owner assignments provisional.

## 2. Prove one shared task

Candidate: a separate private Next.js application, using managed Postgres and authentication. Supabase is a candidate,
not an adopted provider. Keep this private application separate from the public storefront code/data boundary.

Acceptance:

- Two separate users can sign in and operate on the same authorised task.
- User and department permissions are enforced server-side and at the data boundary.
- Concurrent edits cannot silently overwrite each other; stale revisions produce a recoverable conflict.
- Task updates preserve author, time, previous state and evidence references.
- Reloading preserves the task; export and recovery are exercised.
- No elevated database credential is exposed to a browser or an AI session.

## 3. Add the agreed screens and records

Start with Business, department/task navigation, My day and Reference. Model tasks, decisions, dependencies,
evidence references and update history as shared records. All views use those same records.
Distinguish accountable humans from assisting tools. Keep reported completion and evidence verification separate.
Add review requests and quick capture only where the approved workflow requires them.

## 4. Seed a reviewed starting position

Use selected, owner-authorised sources. Deduplicate by stable task/source references. Mark facts, suggestions,
superseded work and unknowns distinctly. Review before adopting the list.
Do not upload whole customer workbooks or raw conversations by default. Hosted pages cannot assume access to
files on an owner’s laptop; source references need an explicitly designed local or protected-document route.

## 5. Establish AI handoff

Begin with a structured import: task reference, proposed change, evidence and remaining checks.
Validate input and permissions, deduplicate repeated submissions and retain the submitting identity.
Later expose the same controlled intake through an authenticated endpoint. Avoid broad administrator keys.
Do not assume automatic access to every chat platform or let a report silently replace an approved decision.

## 6. Add verified read-only integrations

Start with a narrow repository review/check/merge reader if authorised. Add selected commerce facts only after
access, definitions and privacy have been verified. A merge event verifies a narrower claim than a live customer flow.
Add scheduling and agents only when the update workflow and cost controls are agreed.

## Release gates

Test navigation, keyboard access, readable contrast, mobile widths, reduced motion, permission boundaries,
persistence, concurrent edits, review history and recovery. Confirm whether bilingual support is required before
claiming it. Review dependency/security checks before a real app release.

Recheck provider pricing, quotas, data handling, hosting permissions and backup coverage before choosing a plan.
No background AI API usage is required for the initial shared-task slice.
