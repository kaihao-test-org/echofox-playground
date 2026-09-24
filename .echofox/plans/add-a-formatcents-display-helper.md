<!-- Echofox plan 1788c0d7-1703-43fb-a7d3-4522e7af42b1 revision 1 · sha256 b941b2a8ea836e6bb3df4b3885497c436b6add0a6bb61efec554b5c2f6c36699 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount: Cents, currency = "USD"): string` (src/money.ts:88), which renders e.g. `123456` -> `"1,234.56 USD"` using `toLocaleString("en-US")` for the thousands separator on the whole-dollar part and manual sign/fraction handling. There is no helper that produces a `"$"`-prefixed string, which callers currently have to build by hand. CONTRIBUTING.md requires every public export to be re-exported from `src/index.ts` (rule 9) and mentioned in the README, and every branch of logic to have a test (rule 4).

## Goal
Add `formatCents(cents: Cents): string` to `src/money.ts` that renders integer cents as a US dollar string with thousands separators and a leading `$` (after the sign), e.g. `123456` -> `"$1,234.56"`, `-5` -> `"-$0.05"`. Success: `npm run typecheck && npm test` pass, including new tests covering the positive, negative, zero, and large-value cases, and the export is available from `src/index.ts`.

## Approach
Reuse the same integer-only algorithm as `formatMoney` (sign extracted via `amount < 0`, `Math.abs`, `Math.floor(abs / 100).toLocaleString("en-US")` for the whole part, `String(abs % 100).padStart(2, "0")` for the fraction) but place the `$` after the sign and drop the currency-code suffix, since this helper is dollar-specific. Call `assertCents` first for validation consistency with every other money function.

Rejected alternatives:
- Making `formatMoney` accept a `style: "symbol" | "code"` option instead of a new function — rejected because it complicates a stable, widely-used function's signature for one new call shape and CONTRIBUTING keeps behavior changes and additions separate/small.
- Using `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` — rejected to keep the implementation obviously integer-only and consistent with the existing hand-rolled formatting style in this module (and to avoid divide-by-100/float rounding a reviewer would have to double check against rule 1).

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` directly below `formatMoney`, with a one-line doc comment showing the `123456 -> "$1,234.56"` example, matching the existing comment style.
- `src/index.ts`: no change needed — `export * from "./money.js"` already re-exports everything from the module, so `formatCents` is picked up automatically.
- `test/money.test.ts`: add a `describe("formatCents", ...)` block; add `formatCents` to the existing import list from `../src/money.js`.
- `README.md`: extend the "Money" bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`.

## Stack
1. **money: add formatCents US-dollar display helper** — implement the function, export it, document it, and test it; small enough to land as one PR.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)`:
- `"formats with thousands separators"` — `formatCents(123456)` -> `"$1,234.56"`.
- `"formats negative amounts and small values"` — `formatCents(-5)` -> `"-$0.05"`.
- `"formats zero"` — `formatCents(0)` -> `"$0.00"`.
- `"rejects non-integer cents"` — `expect(() => formatCents(19.99)).toThrow(ValidationError)`, mirroring the `assertCents` guard tested for other functions.

## Risks
- Sign/`$` placement ambiguity (`-$0.05` vs `$-0.05`) — resolved explicitly in the goal and locked in by the test for `-5`.
- Divergence from `formatMoney`'s rounding/parsing behavior — mitigated by reusing the exact same integer arithmetic, so both functions stay consistent for the same input.
- Forgetting the `src/index.ts` re-export — not actually needed since it's a wildcard re-export, but the plan calls this out explicitly so the reviewer doesn't have to check.

## Out of scope
- No other currencies/locales for `formatCents` (it's US-dollar-specific by design, per the task).
- No change to `formatMoney`'s signature or behavior.
- No changes to `parseMoney` or other arithmetic helpers.
