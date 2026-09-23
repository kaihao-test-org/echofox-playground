<!-- Echofox plan 31f7e399-fa8e-430e-8bac-b584718cd269 revision 1 · sha256 872d90177e3db5ab4c161107aad48f130018f6e0eab28a04ddc31318ce612e95 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency = "USD")` (src/money.ts:88-95), which renders cents as `"1,234.56 USD"`. There's no helper that produces a currency-symbol-prefixed US dollar string like `"$1,234.56"`, which is what UI code typically wants. CONTRIBUTING.md requires: no floating point for money (rule 1), rounding stays inside `money.ts` (rule 3), every exported public API member is re-exported from `src/index.ts` and mentioned in the README (rule 9), and every new branch needs a test (rule 4).

## Goal
Add `formatCents(cents: Cents): string` to `src/money.ts` that formats integer cents as a US dollar string with thousands separators and a `$` sign, sign-first for negatives (e.g. `123456` → `"$1,234.56"`, `-5` → `"-$0.05"`). Success: `npm run typecheck && npm test` pass, including new tests covering positive, negative, zero, and large values.

## Approach
- Implement `formatCents` by reusing the same integer-only decomposition `formatMoney` already uses (sign, `Math.floor(abs/100)` with `toLocaleString("en-US")`, `abs % 100` padded to 2 digits), just with `$` placed after the sign and no trailing currency code.
- Validate input with the existing `assertCents` guard, consistent with every other function in the module.
- Rejected: implementing via `formatMoney(amount).replace(...)` — couples the two functions' output format together and would break if `formatMoney`'s spacing/format ever changes.
- Rejected: using `Intl.NumberFormat` with `style: "currency"` — pulls in locale/currency rounding behavior that isn't obviously integer-cent-safe and duplicates logic that already exists and is tested in `formatMoney`.

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` near `formatMoney`, with a one-line doc comment showing an example (matching the existing style on `formatMoney`).
- `src/index.ts`: no change needed — it already does `export * from "./money.js"` (src/index.ts:2), so `formatCents` is re-exported automatically.
- `README.md`: extend the "Money" bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`, satisfying CONTRIBUTING rule 9.
- `test/money.test.ts`: add a `describe("formatCents", ...)` block and import `formatCents` alongside the other named imports (test/money.test.ts:3-11).

## Stack
1. **money: add formatCents display helper** — adds the function, export, README mention, and tests in one PR; small enough not to need splitting.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)`:
- `"formats with thousands separators"` — `formatCents(123456)` → `"$1,234.56"`.
- `"formats negative amounts and small values"` — `formatCents(-5)` → `"-$0.05"`.
- `"formats zero"` — `formatCents(0)` → `"$0.00"` (distinct branch from the positive/negative sign logic).
- `"rejects non-integer cents"` — `expect(() => formatCents(19.99)).toThrow(ValidationError)`, covering the `assertCents` guard branch.

## Risks
- Sign placement (`-$0.05` vs `$-0.05`) is easy to get backwards; the negative-value test pins the exact expected string.
- Since `formatCents` duplicates `formatMoney`'s digit-splitting logic rather than delegating, a future bug fix to that logic (e.g. rounding or padding) could be applied to one and not the other; acceptable here for a small, self-contained helper, but worth a code-review callout.

## Out of scope
- Changing `formatMoney`'s signature or output format.
- Supporting currencies other than USD or locale-aware formatting for `formatCents`.
- Parsing `$`-prefixed strings back into cents (no `parseMoney` counterpart needed).
