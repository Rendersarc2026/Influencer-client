---
name: verify
description: Run the full pre-commit verification pass for influencer-client — contract drift check, typecheck, lint, and format — then fix or report what fails. Use before committing, before opening a PR, or whenever asked to "verify", "check the build", or confirm a change is clean.
allowed-tools: Bash, Read, Edit, Grep, Glob
---

# Verify (influencer-client)

Run every gate this repo enforces, in the order below. **Do not stop at the first failure** —
run all four steps, then report the complete picture. A later step often explains an earlier one
(a lint error and a type error usually share a root cause).

Run everything from the repo root: `/home/abin/Desktop/work/Influencer-client`.

## Step 1 — Contract drift

`src/contracts` is generated from the server and must never be hand-edited. Check whether the
committed copy still matches the server's:

```bash
./scripts/sync-contracts.sh && git status --porcelain src/contracts
```

- **Clean output** → contracts are in sync. Continue.
- **Any output** → the committed contracts were stale and the script has just refreshed them.
  Say so explicitly and list the changed files. These changes belong in the commit; do not revert
  them, and do not edit anything under `src/contracts` to make a later step pass.
- **Script errors with "source directory does not exist"** → the sibling `Influencer-server`
  checkout is missing. Skip this step, and say in your report that contract drift was **not**
  verified. Do not invent a result.

## Step 2 — Typecheck

```bash
npm run typecheck
```

This is `tsc --noEmit` over the whole project. Fix real type errors in `src/`. Never fix one by
widening to `any`, by adding `@ts-expect-error`, or by redefining a type that already exists in
`src/contracts` — import the generated type instead.

## Step 3 — Lint

```bash
npm run lint
```

`--max-warnings 0`, so a warning fails the run. Two rules here encode architecture, not style —
fix the design, never the rule:

- `no-restricted-imports` in `src/pages/**` — a page is importing an MUI primitive directly.
  Move the markup into an organism and have the page compose that.
- `react-hooks/*` — fix the dependency array or the hook's placement; do not disable the rule.

Only add an `eslint-disable` if you can state a concrete reason in the same comment, and mention
each one you added in your report.

## Step 4 — Format

The tree has a large backlog of files Prettier has never touched, so `npm run format:check` over
the whole repo always fails and tells you nothing about your change. Check **only the files this
change touched**:

```bash
FILES=$(git diff --name-only --diff-filter=d HEAD | grep -E '\.(ts|tsx|css|json|md)$')
[ -n "$FILES" ] && npx prettier --check $FILES
```

If that fails, rewrite the same list and re-check:

```bash
npx prettier --write $FILES && npx prettier --check $FILES
```

Do not run `npm run format` (`prettier --write .`) as part of a verify pass — it reformats all
61 backlog files and buries the real diff. Repo-wide formatting is its own deliberate commit.

## Reporting

Finish with a short status line per step — `contracts / typecheck / lint / format` — each marked
pass, fixed, failed, or skipped. Then:

- List anything you changed to make a step pass.
- List anything still failing, with the actual compiler or linter output, not a paraphrase.

If a step is still failing when you finish, say so plainly. Never report the pass as green
because three of four steps succeeded.

## Out of scope

This skill verifies; it does not commit, push, or open a PR. Stop when the gates are reported.
