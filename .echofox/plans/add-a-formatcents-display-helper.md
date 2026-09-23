<!-- Echofox plan 7ee15627-2d3e-49e7-9c9a-64d462d93569 revision 1 · sha256 16d5addb9d83a658f3c79fa541d91b594a691ea26eafb0233540b1748056aad4 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount: Cents, currency = "USD"): string`, which renders e.g. `123456` → `"1,234.56 USD"` (src/money.ts:88-95). There is no helper that renders a fixed US-dollar string with a `$` sign and no currency suffix. Public money helpers are re-exported from `src/index.ts:2` and documented in the "Concepts" section of `README.md:23-25` per CONTRIBUTING.md rule 9.

## Goal
`formatCents(cents: Cents): string` in `src/money.ts` renders integer cents as a US dollar string: `123456` → `"$1,234.56"`, `-5` → `"-$0.05"`. It's exported from `src/index.ts`, documented in `README.md`, and covered by tests in `test/money.test.ts`. Verified by `npm run typecheck && npm test` passing.

## Approach
- Implement `formatCents` by validating with `assertCents` (consistent with `formatMoney`), then reuse the same whole/fraction logic as `formatMoney`, placing `$` immediately after the sign and before the digits (`-$0.05`, not `$-0.05`).
- Rejected: implementing `formatCents` by calling `formatMoney` and string-splicing the `"USD"` suffix into a `$` prefix — more fragile and harder to read than duplicating the short, already-tested formatting logic.
- Rejected: using `Intl.NumberFormat` — the codebase already has a hand-rolled integer-safe formatter (`formatMoney`) per CONTRIBUTING.md's "no floating point for money" rule; introducing a second formatting strategy (locale-dependent `Intl`) adds inconsistency for no benefit here.

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` near `formatMoney`, with a one-line doc comment giving an example (matching the existing style at line 87).
- `src/index.ts`: no change needed — `export * from "./money.js"` (line 2) already re-exports it automatically.
- `README.md`: extend the "Money" bullet (lines 23-25) to mention `formatCents` alongside `formatMoney`.
- `test/money.test.ts`: import `formatCents` alongside the existing money imports (line 6) and add a `describe("formatCents", ...)` block.

## Stack
1. **money: add formatCents display helper (1/1)** — adds the function, export, README mention, and tests in one small PR.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)`:
- `"formats with thousands separators"` — `expect(formatCents(123456)).toBe("$1,234.56")`.
- `"formats negative amounts and small values"` — `expect(formatCents(-5)).toBe("-$0.05")`.
- `"formats zero"` — `expect(formatCents(0)).toBe("$0.00")`, to cover the boundary explicitly per CONTRIBUTING.md rule 4.

## Risks
- Sign/`$` placement bug (e.g. `$-0.05` instead of `-$0.05`) — guarded by the explicit negative-value test.
- Missed `assertCents` validation causing silent bad output for non-integer input — guarded by reusing `assertCents`, consistent with every other function in the module.

## Out of scope
- Locale/currency parameterization (this helper is USD-only by design, per the task).
- Changes to `formatMoney` or `parseMoney`.
