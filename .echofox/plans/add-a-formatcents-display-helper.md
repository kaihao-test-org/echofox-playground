<!-- Echofox plan ed30db87-1de3-408f-9c06-514e20224aed revision 1 · sha256 02a15c3665c260ffeaae8ea9eb8835cf395ea8a738d077667ff60a756bc2e2b5 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency = "USD")`, which renders cents as `"1,234.56 USD"` using `toLocaleString` for the thousands separator (src/money.ts:88-95). There is no US-dollar-symbol variant. The task asks for a `formatCents` helper that renders a `$`-prefixed string with the sign in front of the dollar sign for negatives (`"-$0.05"`, not `"$-0.05"`). Per CONTRIBUTING.md, all rounding/formatting must live in `money.ts` (rule 3), every public export must be re-exported from `src/index.ts` and mentioned in the README (rule 9), and every new branch needs a test (rule 4).

## Goal
`formatCents(cents: Cents): string` exists in `src/money.ts`, is exported from `src/index.ts`, and:
- `formatCents(123456)` → `"$1,234.56"`
- `formatCents(-5)` → `"-$0.05"`
- `formatCents(0)` → `"$0.00"`

Verified by `npm run typecheck && npm test` passing, including new cases in `test/money.test.ts`.

## Approach
Mirror `formatMoney`'s existing sign/whole/fraction split (assert cents, take `Math.abs`, `toLocaleString` for the whole part, pad the fraction to 2 digits) but put the sign before `$` and drop the currency code/param — this function is USD-only and dollar-sign-only per the task, unlike the currency-code `formatMoney`.

Rejected alternatives:
- Add a `symbol` option to `formatMoney` instead of a new function — rejected because the task explicitly asks for a separate `formatCents` helper and mixing currency-code and symbol output in one function's return type is confusing for callers.
- Use `Intl.NumberFormat` with `style: "currency"` — rejected to keep the existing string-splicing style consistent with `formatMoney` right above it and avoid depending on `Intl` currency-rounding semantics for an already-integer-cents value.

## Changes
- `src/money.ts` — add `formatCents(amount: Cents): string` directly below `formatMoney`, reusing the same sign/whole/fraction pattern but prefixing `$` after the sign instead of appending a currency code.
- `src/index.ts` — no line changes needed; `export * from "./money.js"` (src/index.ts:2) already re-exports everything from the module.
- `README.md` — extend the existing Money bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`.
- `test/money.test.ts` — add a `describe("formatCents", ...)` block with cases for positive, negative, and zero amounts, and add `formatCents` to the import list.

## Stack
1. **Add formatCents display helper (single PR)** — new pure function, its tests, and doc mention; no other code path touches it, so it lands as one small change.

## Tests
In `test/money.test.ts`, new `describe("formatCents")` block:
- `"formats with thousands separators"` — `formatCents(123456)` → `"$1,234.56"`.
- `"formats negative amounts and small values"` — `formatCents(-5)` → `"-$0.05"`.
- `"formats zero"` — `formatCents(0)` → `"$0.00"`.

## Risks
- Low risk: purely additive, no existing exports or call sites change. Main failure mode is sign placement (`$-0.05` vs `-$0.05`); guarded by the explicit negative-amount test.
- `assertCents` (reused from `formatMoney`) already rejects non-integer/unsafe input, so invalid input is guarded the same way as the existing formatter.

## Out of scope
- Locale/currency-symbol parameterization (e.g. EUR/GBP symbols) — `formatMoney` already covers the currency-code case; `formatCents` is USD-symbol-only per the task.
- Changing `formatMoney`'s existing output format.
