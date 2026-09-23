<!-- Echofox plan 066d3d90-a95d-405b-88d8-ea49a431492a revision 1 · sha256 420daa543a2be8807fbe713717c6885b2ef9f8c9b0d4bb2c333cfee7835607d6 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency = "USD")` (src/money.ts:88-95), which renders cents as `"1,234.56 USD"` using `toLocaleString` for the whole-dollar part and a manually padded fraction, following the "no floating point for money" rule in CONTRIBUTING.md. There is no helper that renders cents in the conventional `$1,234.56` dollar-sign-prefixed, no-currency-suffix format used for plain USD display. The task is to add one such helper, `formatCents`, without touching `formatMoney`.

## Goal
`formatCents(cents: Cents): string` exists in `src/money.ts`, is re-exported from `src/index.ts` (per CONTRIBUTING.md rule 9), and is documented in README.md. `formatCents(123456)` returns `"$1,234.56"` and `formatCents(-5)` returns `"-$0.05"`. Verified by `npm run typecheck && npm test` passing, including new tests that assert both examples and edge cases.

## Approach
Mirror the structure of `formatMoney`: validate with `assertCents`, split sign/whole/fraction the same way, but prefix `$` after the sign instead of appending a currency code.

- **Reuse `formatMoney`'s internals by extracting a shared helper** — rejected: `formatMoney` and `formatCents` differ only in where the sign/currency marker goes, and factoring out a shared piece for two ~5-line functions adds indirection for no real benefit; write `formatCents` standalone instead, in the same style.
- **Add a `symbol`/`currency` parameter to `formatCents` for flexibility** — rejected: task explicitly asks for a fixed US-dollar formatter; YAGNI, `formatMoney` already covers the multi-currency case.
- **Use `Intl.NumberFormat` with `style: "currency"`** — rejected: the codebase's existing `formatMoney` deliberately avoids `Intl` currency formatting in favor of manual integer math to keep behavior explicit and independent of locale data; stay consistent.

## Changes
- `src/money.ts` — add `formatCents(amount: Cents): string` right after `formatMoney`, with a one-line doc comment (matching the existing `/** Formats cents ... */` style) giving the `formatCents(123456) -> "$1,234.56"` example. Implementation: `assertCents(amount)`, compute `sign`, `abs`, `whole` (via `toLocaleString("en-US")`), `fraction` (padded to 2 digits), return `` `${sign}$${whole}.${fraction}` ``.
- `src/index.ts` — no change needed; `export * from "./money.js"` already re-exports everything from the module, so `formatCents` is picked up automatically. (Confirm no explicit named-export list exists elsewhere — none found.)
- `README.md` — extend the "Money" bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`, e.g. "...`formatMoney` to display amounts with a currency code, or `formatCents` for a `$`-prefixed USD string...".
- `test/money.test.ts` — add `formatCents` to the import list (test/money.test.ts:3-11) and a new `describe("formatCents", ...)` block near the existing `formatMoney` tests.

## Stack
Single PR — the change is small (one function, one export via existing wildcard, one README line, a few tests) and has no independent sub-concerns to separate.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)` block:
- `"formats with thousands separators"` — `expect(formatCents(123456)).toBe("$1,234.56")`.
- `"formats negative amounts and small values"` — `expect(formatCents(-5)).toBe("-$0.05")`.
- `"formats zero"` — `expect(formatCents(0)).toBe("$0.00")`, covering the no-sign branch explicitly per CONTRIBUTING.md rule 4 (every branch needs a test).
- `"rejects non-integer cents"` — `expect(() => formatCents(19.99)).toThrow(ValidationError)`, covering the `assertCents` validation branch.

## Risks
- Low risk: purely additive, new function with no callers to break, no change to `formatMoney` or other exports. Main failure mode is a formatting mismatch (e.g. wrong padding for the cents fraction on values like `5` -> should be `.05` not `.5`); covered by the small-value test case.

## Out of scope
- Locale/multi-currency support for `formatCents` (stays USD/`$`-only, per the task).
- Changing or deprecating `formatMoney`.
- Parsing dollar-formatted strings back into cents (no `parseFormattedCents` inverse function).
