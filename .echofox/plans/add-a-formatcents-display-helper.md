<!-- Echofox plan 564b6ca3-bdde-4ec2-88d9-34dd39324bac revision 1 · sha256 4e71ef038d23e620b240b93ae9bab07cb14200ca72441fa57b2c77772d409b70 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency)` (money.ts:88) which renders cents as `"1,234.56 USD"`. It's exported via `src/index.ts` (index.ts:2) and re-exported from the package root. There's no dollar-sign, US-locale-specific formatter; consumers currently have to build one themselves or reuse `formatMoney` and strip the currency code. The task asks for a small dedicated helper, `formatCents`, that renders a `$`-prefixed US dollar string.

## Goal
`formatCents(cents: Cents): string` exists in `src/money.ts`, is exported from `src/index.ts`, and is covered by tests in `test/money.test.ts`. `formatCents(123456)` returns `"$1,234.56"` and `formatCents(-5)` returns `"-$0.05"`. Success is `npm test` passing and `npm run typecheck` passing.

## Approach
Implement `formatCents` by reusing the same integer-only whole/fraction split `formatMoney` already uses (`Math.floor(abs / 100).toLocaleString("en-US")` + zero-padded remainder), just with sign and `$` placed before the whole part instead of a trailing currency code. Keep it as a thin, standalone function next to `formatMoney` rather than trying to parameterize `formatMoney` with a `style` flag — the two have different sign/symbol placement rules and a shared implementation would need a branchy signature for one call site's benefit.

Rejected alternatives:
- Add a `symbol`/`style` option to `formatMoney` instead of a new function — rejected, complicates a stable existing signature for one extra format.
- Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` — rejected, keeps formatting logic consistent (and dependency-free) with the existing hand-rolled `formatMoney`, and avoids locale/rounding surprises since `Cents` is already an integer.

## Changes
- `src/money.ts`: add `export function formatCents(amount: Cents): string` near `formatMoney`, with a one-line comment showing the example (matching the existing `formatMoney` doc-comment style).
- `src/index.ts`: no change needed — `export * from "./money.js"` already re-exports it.
- `test/money.test.ts`: import `formatCents` and add a `describe("formatCents", ...)` block.

## Stack
1. **Add `formatCents` helper with tests** — single PR: implementation, export (via existing barrel), and tests land together since it's a small, self-contained addition.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)`:
- `"formats with a dollar sign and thousands separators"` — asserts `formatCents(123456)` === `"$1,234.56"`.
- `"formats negative amounts and small values"` — asserts `formatCents(-5)` === `"-$0.05"`.
- `"formats zero"` — asserts `formatCents(0)` === `"$0.00"`.

## Risks
- Sign/`$` placement bug (e.g. `$-5.00` instead of `-$5.00`) — guarded by the negative-value test.
- Off-by-one in thousands separators or padding — guarded by reusing the already-correct `formatMoney` logic and the `123456` test case.

## Out of scope
- Locale/currency parameterization (EUR, GBP, etc.) — `formatCents` is US-dollar-only per the task.
- Changing or refactoring `formatMoney`.
