<!-- Echofox plan fb137b11-1b7f-4ba7-9cae-a4f99b781209 revision 1 · sha256 763ff851ec5d1f4bd1f5bb25d135d26c9d39aa8031acd3e6d0fc95cbf4ac431e -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency)` (src/money.ts:88-95), which renders cents as `"1,234.56 USD"` using `toLocaleString` for the thousands separator and manual sign/fraction handling. There is no helper that renders a plain US-dollar string with a `$` sign, which is what a UI would want for direct display (e.g. `"$1,234.56"` or `"-$0.05"`). All money helpers live in `src/money.ts`, are re-exported from `src/index.ts` (per CONTRIBUTING.md rule 9), and are documented in the README's "Concepts" section (README.md:23-25).

## Goal
Add `formatCents(cents: Cents): string` that renders integer cents as a US dollar string with thousands separators and a leading `$`, placing the `-` sign before the `$` for negative amounts (e.g. `123456` → `"$1,234.56"`, `-5` → `"-$0.05"`). Success: `npm run typecheck && npm test` pass, the function is exported from `src/index.ts`, and new tests in `test/money.test.ts` cover the positive, negative, and zero cases.

## Approach
Mirror `formatMoney`'s existing implementation (assert valid cents, split sign/whole/fraction, use `toLocaleString("en-US")` for the thousands separator) but drop the currency suffix and prepend `$` after the sign.
- Reject: making `formatMoney` accept a `format: "symbol" | "code"` option — bigger surface change than needed and the task asks for a distinct, simply-named helper.
- Reject: using `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` — it would require converting cents to a float dollar amount, which CONTRIBUTING.md rule 1 forbids even for display, and its rounding/negative-sign placement is less predictable than building the string manually like `formatMoney` already does.

## Changes
- `src/money.ts`: add `formatCents(cents: Cents): string` directly below `formatMoney`, following the same sign/whole/fraction pattern, validated with `assertCents`.
- `src/index.ts`: no change needed — it already does `export * from "./money.js"`, so `formatCents` is picked up automatically.
- `test/money.test.ts`: add a `describe("formatCents", ...)` block importing `formatCents` alongside the existing `formatMoney` import.
- `README.md`: extend the "Money" bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`, satisfying CONTRIBUTING.md rule 9.

## Stack
1. **Add `formatCents` with tests and docs** — single PR: new function, its tests, and the one-line README mention. No other public API changes, so it is safe to land alone.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)` block:
- `"formats with thousands separators"`: `formatCents(123456)` → `"$1,234.56"`.
- `"formats negative amounts with the sign before the dollar sign"`: `formatCents(-5)` → `"-$0.05"`.
- `"formats zero"`: `formatCents(0)` → `"$0.00"`.
- `"rejects non-integer cents"`: `expect(() => formatCents(19.99)).toThrow(ValidationError)` (mirrors CONTRIBUTING.md rule 4 — every branch, including the `assertCents` guard, needs a test).

## Risks
- Low risk: purely additive (new export, no existing signatures change), so nothing that imports `money.ts` or `index.ts` today can break.
- Main risk is inconsistency with `formatMoney`'s sign placement; guarded by the explicit negative-number test asserting `"-$0.05"` (sign before `$`, not `$-0.05`).

## Out of scope
- Locale support beyond `en-US` / USD.
- Changing or deprecating `formatMoney`.
- Parsing dollar-formatted strings back into cents.
