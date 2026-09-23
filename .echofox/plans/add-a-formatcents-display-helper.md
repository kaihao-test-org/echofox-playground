<!-- Echofox plan a196e304-7c6c-4382-a838-8cb42023cc8b revision 1 · sha256 edf060eb5ae7d7acc5c3661da0baeecfc607776b108fc174e7faa9f2d2f6add5 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency = "USD")` (src/money.ts:88), which renders cents as `"1,234.56 USD"` — a currency-suffixed, locale-agnostic display format. There's no helper that produces a plain `$`-prefixed US dollar string (e.g. for UI labels that don't want a trailing currency code). All public money helpers are re-exported from `src/index.ts` and documented in `README.md`'s Concepts section per CONTRIBUTING.md rule 9.

## Goal
Add `formatCents(cents: Cents): string` to `src/money.ts` that renders integer cents as `"$1,234.56"` / `"-$0.05"`, export it from `src/index.ts`, and cover it with tests in `test/money.test.ts`. Success: `npm run typecheck && npm test` pass, and the new tests assert the exact examples from the task (`123456 -> "$1,234.56"`, `-5 -> "-$0.05"`).

## Approach
- Implement `formatCents` by reusing the same sign/whole/fraction decomposition already used in `formatMoney` (src/money.ts:88-95), but placing `$` after the sign and before the digits, with no trailing currency code.
- Validate input with the existing `assertCents` (consistent with `formatMoney`, `addMoney`, etc.) so it throws `ValidationError` on non-integer input rather than silently misformatting.
- Rejected: making `formatMoney` accept a `symbol`/format option instead of adding a new function — rejected because it would change an existing function's signature/behavior for a display flourish the task doesn't ask for, and the task explicitly asks for a distinct `formatCents` helper.
- Rejected: using `Intl.NumberFormat` — rejected to stay consistent with the existing hand-rolled, dependency-free formatting already used by `formatMoney`, and to keep exact control over the `$`-before-sign edge case (`-$0.05`, not `$-0.05`).

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` near `formatMoney`, with a one-line doc comment giving the same example format as `formatMoney`'s comment.
- `src/index.ts`: no change needed — it already does `export * from "./money.js"` (src/index.ts:2), so `formatCents` is re-exported automatically once added.
- `test/money.test.ts`: import `formatCents` alongside the other named imports (test/money.test.ts:3-11) and add a `describe("formatCents", ...)` block.
- `README.md`: extend the Money bullet in Concepts (README.md:23-25) to mention `formatCents` alongside `formatMoney`, per CONTRIBUTING.md rule 9.

## Stack
1. **Add formatCents display helper (1/1)** — implement the function, export it, document it, and test it in one PR; there's no behavior change to existing code and nothing to split out.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)` block:
- `"formats with thousands separators and a dollar sign"` — asserts `formatCents(123456)` is `"$1,234.56"`.
- `"formats negative amounts and small values"` — asserts `formatCents(-5)` is `"-$0.05"`.
- `"formats zero"` — asserts `formatCents(0)` is `"$0.00"` (boundary not covered by the two examples above).
- `"rejects non-integer cents"` — asserts `() => formatCents(19.99)` throws `ValidationError`, mirroring the existing `cents`/`formatMoney` validation tests and satisfying CONTRIBUTING.md rule 4 (every branch needs a test).

## Risks
- Sign placement bug (`$-` vs `-$`) is the main correctness risk for negative values; the zero and negative test cases guard against it.
- Since `src/index.ts` re-exports via `export *`, no risk of forgetting the export as long as the function is actually named and exported from `money.ts`; the README mention is the only manual step covered by CONTRIBUTING.md rule 9.

## Out of scope
- Changing `formatMoney`'s signature or behavior.
- Locale support beyond `en-US` / currencies beyond USD.
- Parsing `$`-prefixed strings back into cents (no `parseCentsDisplay` counterpart requested).
