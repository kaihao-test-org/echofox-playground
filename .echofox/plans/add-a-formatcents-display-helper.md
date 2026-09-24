<!-- Echofox plan 1455ac48-d9cd-42bf-907c-49f6340052ff revision 1 · sha256 14e313f8dc8092963debabf3dd0064224a3b14017eb1a99fa4114ebc22d5b3c7 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency)` (src/money.ts:88-95), which renders cents as `"1,234.56 USD"` — a currency-suffixed style used for invoice display. There is no helper that renders a plain US-dollar-sign string like `"$1,234.56"`, which is the format needed for compact UI labels (e.g. a total shown without a currency code). All public exports are re-exported from `src/index.ts` and must also be mentioned in `README.md` per CONTRIBUTING.md rule 9.

## Goal
Add `formatCents(cents: Cents): string` that renders integer cents as a `$`-prefixed US dollar string with thousands separators and a sign before the `$` for negatives (`123456` → `"$1,234.56"`, `-5` → `"-$0.05"`, `0` → `"$0.00"`). Verified by new unit tests in `test/money.test.ts` and by `npm run typecheck && npm test` passing.

## Approach
Reuse the exact sign/whole/fraction decomposition already used in `formatMoney` (src/money.ts:88-95) — `Math.floor(abs / 100).toLocaleString("en-US")` for the thousands-separated whole part, `String(abs % 100).padStart(2, "0")` for the fraction — but place the `$` after the sign and omit the currency suffix.

Rejected alternatives:
- Implement with `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` — rejected because it hides the cents→dollars division inside the Intl call, diverging from the project's convention (CONTRIBUTING.md rule 1) of doing the split explicitly in `money.ts`, and its negative-sign placement is version/locale-dependent; explicit string building matches existing `formatMoney` exactly and keeps behavior obvious and tested.
- Add a `currency`/`symbol` parameter to `formatCents` to avoid near-duplication with `formatMoney` — rejected: task asks for a fixed US dollar format, and `formatMoney` already covers the parameterized/currency-suffix case; keeping `formatCents` fixed-format keeps its signature and behavior trivial to reason about.

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` directly below `formatMoney`, following the same `assertCents` → sign/abs → whole/fraction pattern, returning `` `${sign}$${whole}.${fraction}` ``.
- `src/index.ts`: no change needed — it already does `export * from "./money.js"`, so `formatCents` is re-exported automatically once added.
- `test/money.test.ts`: import `formatCents` from `../src/money.js` and add a `describe("formatCents", ...)` block.
- `README.md`: extend the "Money" bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`.

## Stack
1. **Add `formatCents` display helper** — implementation, tests, and README mention land together since this is a small, additive, non-breaking change with no behavior change to existing functions.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)` block:
- `"formats with thousands separators"` — `expect(formatCents(123456)).toBe("$1,234.56")`.
- `"formats negative amounts and small values"` — `expect(formatCents(-5)).toBe("-$0.05")`.
- `"formats zero"` — `expect(formatCents(0)).toBe("$0.00")`.

## Risks
- Sign placement bug (`$-1.00` vs `-$1.00`) — guarded by the explicit negative-value test case.
- Diverging from `formatMoney`'s rounding/validation behavior — guarded by reusing the identical `assertCents` + `Math.floor`/`%` decomposition, so both functions reject non-integer cents the same way.
- Forgetting the README mention (CONTRIBUTING.md rule 9 is enforced by reviewers) — addressed explicitly in Changes.

## Out of scope
- Locale/currency parameterization of `formatCents` (that's what `formatMoney` is for).
- Changing `formatMoney`'s existing output format.
- Any UI/consumer code that would call `formatCents`.
