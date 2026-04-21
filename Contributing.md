# Contributing to Peerly

Thanks for your interest in contributing! Please read this before opening a PR.

## Getting started

1. Fork the repo and clone your fork.
2. Run `cd backend && npm install` then `npm run dev`.
3. Open `frontend/register.html` to verify the app loads.

## Branching

Branch off `main` for all changes. Use one logical change per branch.

```
git checkout -b feat/your-feature
git checkout -b fix/your-fix
```

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): add email verification flow
fix(requests): prevent duplicate mentor requests
docs(readme): clarify env variable setup
refactor(match): extract scoring into helper
test(auth): add login route unit tests
```

Format: `type(scope): short description`

## Pull request format

**Title:** same format as commit messages above.

**Description template** — copy this into your PR:

```
## What does this PR do?

## How to test

## Related issue
Closes #<issue-number>
```

## Code style

- Backend: 2-space indent, semicolons, async/await over callbacks.
- Frontend JS: vanilla, no bundler. Keep logic in `/js` files, not inline.
- No `console.log` left in committed code.
- Run `npm run lint` before pushing (ESLint config in `backend/.eslintrc.json`).

## Tests

- Backend route tests go in `backend/tests/`.
- Run `npm test` to execute the test suite.
- PRs that add new API routes are expected to include at least one test.

## Review timeline

PRs are reviewed within **1-2 days**. If you haven't heard back in a week, leave a comment pinging me.

## What makes a good PR

- Focused: does one thing and does it well.
- Tested locally: you've verified it works end-to-end.
- No unrelated formatting changes mixed in.
- Description explains *why*, not just *what*.
