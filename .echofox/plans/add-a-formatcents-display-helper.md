<!-- Echofox plan 6590ec1d-46b2-410c-95cf-c071be875ef0 revision 1 · sha256 85c90ab2ac4e27e4ef4f34a10555e7a2a529a414beec91c2655c05c3b16ba80c -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency = "USD")` (src/money.ts:88-95), which renders cents as `"1,234.56 USD"` — no currency symbol, symbol-less suffix format. Some callers (e.g. dashboard-style UI code) want a plain US-dollar string with a `$` sign and no trailing currency code, e.g. `123456 -> "$1,234.56"` and `-5 -> "-$0.05"`. There's no such helper today, so callers would otherwise hand-roll string formatting outside `money.ts`, which CONTRIBUTING.md rule 1 forbids (all money formatting must live in `money.ts` and avoid floating point). `src/index.ts` re-exports everything from `money.ts` (rule 9), and `test/money.test.ts` already has a `describe("formatMoney", ...)` block to follow as a template.

## Goal
Add `formatCents(cents: Cents): string` to `src/money.ts` that:
- Validates input via `assertCents` like the other helpers.
- Renders as `$<whole-with-thousands-separators>.<2-digit-fraction>`, sign (`-`) before the `$` for negative amounts.
- `formatCents(123456) === "$1,234.56"`, `formatCents(-5) === "-$0.05"`.
Done when: exported from `src/index.ts`, covered by new tests in `test/money.test.ts`, mentioned in README per rule 9, and `npm run typecheck && npm test` pass.

## Approach
Implement `formatCents` by extracting the shared sign/whole/fraction computation that `formatMoney` already does into a small private helper, then have `formatCents` prefix `$` between the sign and the digits instead of appending a currency code.
- Rejected: making `formatCents` call `formatMoney(amount, "")` and string-surgery the result — fragile and couples the two formats.
- Rejected: adding a `symbol` option to `formatMoney` itself — changes an existing function's signature/behavior for no benefit; a separate small function keeps `formatMoney`'s existing contract stable.
- Rejected: using `Intl.NumberFormat('en-US', {style:'currency', currency:'USD'})` — pulls in locale/rounding behavior not obviously aligned with the codebase's own integer-cent formatting (fraction padding, `-0` handling); staying consistent with the file's existing hand-rolled approach is safer.

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` next to `formatMoney`, sharing its sign/whole/fraction logic via a small private helper used by both functions, to avoid duplicating the `Math.abs`/`toLocaleString`/`padStart` logic.
- `src/index.ts`: no change needed — already does `export * from "./money.js"`, so `formatCents` is re-exported automatically once added.
- `test/money.test.ts`: add a `describe("formatCents", ...)` block with cases for the example values plus zero and rejection of non-integer input.
- `README.md`: extend the Money bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`.

## Stack
Single PR: "money: add formatCents display helper". The change is additive, isolated to one module plus its export surface, tests, and a doc line — no reason to split further.

## Tests
In `test/money.test.ts`, new `describe("formatCents")` block:
- `"formats with a dollar sign and thousands separators"` — asserts `formatCents(123456) === "$1,234.56"`.
- `"formats negative amounts with the sign before the dollar sign"` — asserts `formatCents(-5) === "-$0.05"`.
- `"formats zero"` — asserts `formatCents(0) === "$0.00"`.
- `"rejects non-integer cents"` — asserts `formatCents(19.99)` throws `ValidationError`, per CONTRIBUTING.md rule 4 (every branch, including the shared `assertCents` guard, needs coverage).

## Risks
- Low risk: purely additive (new export, no changes to `formatMoney`'s existing behavior or signature), so no existing caller is affected.
- Main risk is subtle sign/rounding bugs at the cent boundary (e.g. `-0` cents, values under 100) — mitigated by explicit test cases for zero and sub-dollar negative amounts, matching the pattern `formatMoney`'s own tests already use.
- Guard: reusing (not reimplementing) the sign/whole/fraction computation from `formatMoney` avoids drift between the two formatters.

## Out of scope
- Locale/currency support beyond USD (`formatMoney` already supports other currency labels; `formatCents` is a US-dollar-specific display helper only, per the task).
- Changing `formatMoney`'s existing output format or signature.
