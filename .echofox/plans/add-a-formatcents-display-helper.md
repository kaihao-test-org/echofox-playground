<!-- Echofox plan 6195d7bf-1cce-4ffc-8b8d-ebfe1b9519fe revision 1 · sha256 d09ab773c18ebdc1fb212f017476f131a8228c8e6e385ccf8f619e243d3c0f42 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency)` (src/money.ts:88) which renders cents as `"1,234.56 USD"`. There is no dollar-sign, no-currency-suffix variant for UI contexts that just want `"$1,234.56"`. All money helpers are re-exported from `src/index.ts` and documented in the "Concepts" section of `README.md` per CONTRIBUTING.md rule 9 ("anything exported... must be re-exported from `src/index.ts` and mentioned in the README").

## Goal
Add `formatCents(cents: Cents): string` that renders integer cents as a US dollar string with thousands separators and a leading `$`, e.g. `123456 -> "$1,234.56"`, `-5 -> "-$0.05"`. Success = `npm run typecheck && npm test` pass, `formatCents` is importable from `src/index.ts`, and it's listed in the README's Money bullet.

## Approach
- Extract the existing sign/whole/fraction computation in `formatMoney` into a small private helper (e.g. `splitForDisplay`) so `formatMoney` and `formatCents` share the exact same integer-only arithmetic instead of duplicating it — CONTRIBUTING.md forbids floating point for money, so any duplicate implementation must stay in lock-step; sharing one helper removes that risk.
- `formatCents` calls the shared helper and formats as `` `${sign}$${whole}.${fraction}` ``, keeping the `$` before the sign for negatives (`-$0.05`, not `$-0.05`) to match the task's example.
- Rejected: implementing `formatCents` by string-manipulating `formatMoney`'s output (e.g. stripping `" USD"` and prepending `$`) — couples the two functions' output formats and breaks if `formatMoney`'s suffix format ever changes.
- Rejected: using `Intl.NumberFormat`/`toLocaleString("en-US", { style: "currency" })` directly on `amount / 100` — CONTRIBUTING.md rule 1 explicitly forbids dividing cents by 100 into a float for display formatting; keep the existing integer `Math.floor`/`%` approach.

## Changes
- `src/money.ts`: extract a private `splitForDisplay(amount: Cents): { sign: string; whole: string; fraction: string }` helper from the body of `formatMoney`; rewrite `formatMoney` to use it; add `export function formatCents(amount: Cents): string` using the same helper, returning `` `${sign}$${whole}.${fraction}` ``.
- `src/index.ts`: no change needed — it already does `export * from "./money.js"`, so `formatCents` is exported automatically once added.
- `test/money.test.ts`: add a `describe("formatCents", ...)` block; import `formatCents` alongside the existing `money.js` imports.
- `README.md`: extend the "Money" bullet under "## Concepts" to mention `formatCents` alongside `formatMoney` (e.g. "...`formatMoney` to display amounts with a currency code, or `formatCents` for a `$`-prefixed string...").

## Stack
1. **money: add formatCents display helper** — implement the helper (with internal refactor of `formatMoney`), export it, test it, and document it. This is small enough to land as one PR.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)`:
- `"formats with thousands separators"` — `expect(formatCents(123456)).toBe("$1,234.56")`.
- `"formats negative amounts and small values"` — `expect(formatCents(-5)).toBe("-$0.05")`.
- `"formats zero"` — `expect(formatCents(0)).toBe("$0.00")`.
- `"rejects fractional cents"` — `expect(() => formatCents(19.99)).toThrow(ValidationError)`, mirroring the existing validation coverage pattern for other money functions per CONTRIBUTING.md rule 4.
- Existing `describe("formatMoney", ...)` tests must still pass unchanged after the internal refactor (regression check that the extraction didn't change `formatMoney`'s behavior).

## Risks
- Refactoring `formatMoney` to use a shared helper could subtly change its output (e.g. whitespace, currency placement) — mitigated by keeping the existing `formatMoney` tests unchanged and green.
- Sign placement for negative values (`-$0.05` vs `$-0.05`) is easy to get backwards — covered explicitly by the negative-amount test.
- Forgetting the README update would violate CONTRIBUTING.md rule 9; called out explicitly in Changes.

## Out of scope
- Locales/currencies other than US dollar formatting (task only asks for a US dollar string).
- Changing `formatMoney`'s existing signature or output format.
- Parsing `$`-prefixed strings back into cents (no `parseCents`/`parseMoney` change requested).
