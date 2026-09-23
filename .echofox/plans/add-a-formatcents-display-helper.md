<!-- Echofox plan 62a64cb4-aaf3-4ef3-a928-464eb8d8fc05 revision 1 · sha256 7428e809886660a0013f4084e7444a43751e97201159ba400af112319dab2547 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency)` (src/money.ts:88) which renders cents as `"1,234.56 USD"` using `toLocaleString("en-US")` for the thousands separator on the whole-dollar part. There is no USD-symbol-prefixed formatter. `src/index.ts` re-exports everything from `./money.js` via `export *`, so no explicit new export line is needed there. `test/money.test.ts` has a `describe("formatMoney", ...)` block (test/money.test.ts:84) that is the template to follow for the new helper's tests.

## Goal
Add `formatCents(cents: Cents): string` to `src/money.ts` that renders integer cents as a US dollar string, e.g. `123456` → `"$1,234.56"` and `-5` → `"-$0.05"`. Success = new unit tests pass and `formatCents` is importable from `src/index.ts` (via the existing `export *`).

## Approach
- Implement `formatCents` using the same sign/whole/fraction decomposition as `formatMoney`, but place the sign before the `$` (i.e. `-$0.05`, not `$-0.05`) and put `$` immediately before the digits.
- Reuse `assertCents` for validation, matching `formatMoney`'s behavior of throwing `ValidationError` on non-integer input.
- Rejected: refactoring `formatMoney`/`formatCents` to share a common internal helper — the logic is ~4 lines and duplicating it keeps this PR minimal and avoids touching `formatMoney`'s tested behavior.
- Rejected: using `Intl.NumberFormat` with `style: "currency"` — it doesn't guarantee the exact `-$0.05` sign placement across environments without extra options, and the manual approach already matches the codebase's existing pattern.

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` after `formatMoney`, with a one-line doc comment showing the example, following the same sign/whole/fraction logic as `formatMoney` but prefixing `$` and placing sign first.
- `test/money.test.ts`: import `formatCents` from `../src/money.js` and add a `describe("formatCents", ...)` block with cases for the thousands-separator example and the negative small-value example.
- `src/index.ts`: no change needed — `export * from "./money.js"` already re-exports the new function; confirm by importing `formatCents` from the package root in a smoke check if desired (not required, since existing `export *` covers it).

## Stack
1. **Add formatCents display helper** — single PR: new function in `src/money.ts`, tests in `test/money.test.ts`, verified reachable via `src/index.ts`'s existing `export *`.

## Tests
- `test/money.test.ts` › `describe("formatCents")` › `"formats with thousands separators"`: `expect(formatCents(123456)).toBe("$1,234.56")`.
- `test/money.test.ts` › `describe("formatCents")` › `"formats negative small values"`: `expect(formatCents(-5)).toBe("-$0.05")`.
- `test/money.test.ts` › `describe("formatCents")` › `"rejects non-integer cents"`: `expect(() => formatCents(19.99)).toThrow(ValidationError)`, mirroring the existing `assertCents` coverage pattern used elsewhere in the file.

## Risks
- Sign placement bug (`$-0.05` vs `-$0.05`) is the main correctness risk; guarded directly by the negative-value test.
- No other module currently depends on `formatMoney`'s output shape, so adding a neighboring function carries no regression risk to existing call sites.

## Out of scope
- Changing `formatMoney` or its output format.
- Locale/currency parameterization for `formatCents` (it is USD-only, per the task).
- Any changes to `parseMoney` or arithmetic helpers.
