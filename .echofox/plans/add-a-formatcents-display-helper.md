<!-- Echofox plan 14d06fb9-7498-4e27-8f78-04b7fc1d2ec6 revision 1 · sha256 2d36b49a9f01e74ccfe8bd664652cb53a117e5d8010e27c6c8032dd56cb149ef -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency)` (src/money.ts:88), which renders cents as `"1,234.56 USD"` using `toLocaleString("en-US")` for thousands separators. There is no helper that renders a plain US-dollar string with a `$` prefix (e.g. for UI labels where a currency suffix is undesirable). All public money helpers are re-exported from `src/index.ts` and documented in the "Concepts" section of `README.md` (CONTRIBUTING.md rule 9). Existing tests for this module live in `test/money.test.ts` and follow a `describe`-per-function, `it.each` style.

## Goal
Add `formatCents(cents: Cents): string` to `src/money.ts` that renders integer cents as a US dollar string with thousands separators and a `$` sign, placed before the minus sign for negatives (e.g. `123456` → `"$1,234.56"`, `-5` → `"-$0.05"`). Verified by `npm run typecheck && npm test` passing, with new tests asserting the exact examples from the task plus zero and a multi-thousand value.

## Approach
- Implement `formatCents` by reusing the same integer-only technique as `formatMoney`: `assertCents`, compute sign/abs/whole/fraction, use `toLocaleString("en-US")` on the whole-dollar part for separators, and pad the fraction — just with a fixed `"$"` prefix instead of a currency suffix, per CONTRIBUTING.md rule 1 (no floating point / `toFixed`).
- Rejected: implementing via `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` on `cents / 100` — pulls a float division into the formatting path and risks float rounding artifacts for edge values, which rule 1 explicitly warns against; the existing string-based `formatMoney` pattern has no such risk and keeps the two formatters consistent.
- Rejected: making `formatCents` delegate to `formatMoney` and string-munging the result (strip `" USD"`, insert `$`) — fragile string surgery for negligible code reuse; a few duplicated lines matching the existing `formatMoney` shape is clearer and rule-compliant on its own.

## Changes
- `src/money.ts` — add `formatCents(amount: Cents): string` near `formatMoney`, following the same sign/abs/whole/fraction pattern but prefixing `$` and omitting the currency suffix.
- `src/index.ts` — no edit needed; `export * from "./money.js"` already re-exports it (verify after adding).
- `test/money.test.ts` — import `formatCents` and add a `describe("formatCents", ...)` block.
- `README.md` — extend the "Money" bullet in Concepts to mention `formatCents` alongside `formatMoney`.

## Stack
1. **money: add formatCents display helper** — new pure function + export + tests + README mention, one small self-contained PR.

## Tests
In `test/money.test.ts`, `describe("formatCents", ...)`:
- `"formats with thousands separators"` — `formatCents(123456)` toBe `"$1,234.56"`.
- `"formats negative amounts and small values"` — `formatCents(-5)` toBe `"-$0.05"`.
- `"formats zero"` — `formatCents(0)` toBe `"$0.00"`.

## Risks
- Sign/prefix ordering bug (e.g. producing `"$-0.05"` instead of `"-$0.05"`) — guarded by the explicit negative-value test asserting the exact string.
- Divergence from `formatMoney`'s rounding/truncation behavior — mitigated by reusing the identical integer-only computation, no new arithmetic logic introduced.

## Out of scope
- Locales/currencies other than en-US/USD.
- Changing `formatMoney`'s existing signature or output format.
- Parsing `$`-prefixed strings back into cents (`parseMoney` already rejects `"$5"` and that stays unchanged).
