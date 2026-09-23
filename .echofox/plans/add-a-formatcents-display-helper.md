<!-- Echofox plan 58c3e8f6-cad1-4da1-af1a-106bac61ad27 revision 1 · sha256 d8b8f0934ac165df6565f6c9fdcc52f2d55d738850ca70c7a8b061013b1ebbd9 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency)`, which renders cents as `"1,234.56 USD"` (CONTRIBUTING.md keeps rounding/formatting rules scoped to `src/money.ts`, rule 3). There is no helper that renders a US-dollar-sign string like `"$1,234.56"`. Callers who want that today would have to hand-roll it, risking the float/`toFixed` mistakes CONTRIBUTING.md rule 1 warns about. `src/index.ts` re-exports every module (rule 9 requires public API exports to be re-exported and mentioned in the README), and `test/money.test.ts` has an existing `describe("formatMoney", …)` block to mirror.

## Goal
Add `formatCents(cents: Cents): string` to `src/money.ts` that renders integer cents as a US dollar string with thousands separators and a leading `$`, e.g. `123456 -> "$1,234.56"` and `-5 -> "-$0.05"` (sign before the `$`). Export it from `src/index.ts`, document it in the README, and cover it with tests. Verified by `npm run typecheck && npm test` passing, including new `formatCents` test cases matching the two examples in the task.

## Approach
Implement `formatCents` by reusing the same integer-only technique as `formatMoney` (sign extraction, `Math.abs`, `Math.floor`/`%` split, `toLocaleString("en-US")` for the thousands separator) but hard-coded to USD with a `$` prefix instead of a currency suffix, so no floating-point division or `toFixed` is introduced (CONTRIBUTING.md rule 1).
- Rejected: implement via `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` — correct output but hides the integer-cents arithmetic this codebase deliberately keeps explicit and auditable in one place; also needs a rounding-mode footnote for negative zero that plain string math avoids.
- Rejected: implement `formatCents` in terms of `formatMoney(amount).replace(...)` — couples an unrelated internal helper's currency-suffix format to a dollar-sign format, fragile if `formatMoney`'s format ever changes.

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` near `formatMoney`, calling `assertCents` and reusing the same sign/whole/fraction split, returning `` `${sign}$${whole}.${fraction}` ``.
- `src/index.ts`: no line changes needed — `formatCents` is exported automatically via the existing `export * from "./money.js"`; confirm this during implementation.
- `README.md`: extend the "Money" bullet under `## Concepts` to mention `formatCents` alongside `formatMoney` (rule 9).
- `test/money.test.ts`: import `formatCents` and add a `describe("formatCents", …)` block mirroring the existing `formatMoney` tests.

## Stack
1. **Add formatCents display helper (1/1)** — implement the function, export, README mention, and tests in one PR; it's a small, additive, non-breaking change with no callers to coordinate.

## Tests
In `test/money.test.ts`, new `describe("formatCents", …)`:
- `"formats with thousands separators and a dollar sign"` — `expect(formatCents(123456)).toBe("$1,234.56")`.
- `"formats negative amounts and small values"` — `expect(formatCents(-5)).toBe("-$0.05")`.
- `"formats zero"` — `expect(formatCents(0)).toBe("$0.00")`, an explicit boundary case alongside the positive/negative ones, matching the `formatMoney` precedent.

## Risks
- Sign placement is easy to get wrong (`$-0.05` vs `-$0.05`); guarded by the explicit negative-value test.
- Divergence from `formatMoney`'s rounding/edge-case behavior (e.g. negative zero, non-integer input) if the implementation isn't copied carefully; guarded by reusing `assertCents` and the same arithmetic, plus mirroring `formatMoney`'s test shape.
- Forgetting the README/export step would violate CONTRIBUTING.md rule 9 and fail review; both are included as explicit changes.

## Out of scope
- Locale/currency parameterization (e.g. non-USD symbols) — task explicitly asks for a US dollar-only helper.
- Changing or refactoring `formatMoney` itself.
