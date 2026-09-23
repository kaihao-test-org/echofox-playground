<!-- Echofox plan 483a1687-416f-4d9b-adee-42bbf294453f revision 1 · sha256 5fb83c9a19e55203a014fbd6964ea9c7ef6329ab0f819e38a589cfac16489b9f -->

# Add a formatCents display helper

## Context
`src/money.ts` already has a display formatter, `formatMoney(amount, currency = "USD")` (src/money.ts:88-95), which renders cents as `"1,234.56 USD"`. It's re-exported via `src/index.ts:2` and documented in `README.md:23-25`. The task asks for a second, dollar-sign-prefixed variant, `formatCents(cents: Cents): string`, that renders e.g. `123456 → "$1,234.56"` and `-5 → "-$0.05"`. There is no US-dollar-sign formatter today, and `CONTRIBUTING.md` requires every exported API to be re-exported from `src/index.ts` and mentioned in the README, and every branch of logic (here: sign handling) to have a test.

## Goal
`formatCents` is available as `import { formatCents } from "./money.js"` and from the package root (`src/index.ts`), converts integer cents to a `$`-prefixed US dollar string with thousands separators, and matches the two examples in the task exactly. Verified by `npm run typecheck && npm test` passing, including new cases in `test/money.test.ts`.

## Approach
Reuse the exact whole/fraction split and rounding-free integer arithmetic already proven in `formatMoney` (`Math.floor(abs / 100).toLocaleString("en-US")` + `String(abs % 100).padStart(2, "0")`), just changing the sign/currency placement: `${sign}$${whole}.${fraction}` instead of `${sign}${whole}.${fraction} ${currency}`.

Rejected alternatives:
- Add a `symbol`/format-style parameter to `formatMoney` instead of a new function — rejected because the task explicitly asks for a distinct `formatCents` name and the two output shapes (`"$1,234.56"` vs `"1,234.56 USD"`) are different enough that a shared signature would need a boolean/enum flag, which is less clear at call sites.
- Use `Intl.NumberFormat` with `style: "currency"` — rejected to keep behavior consistent with the existing hand-rolled formatter (predictable output, no locale/currency-data surprises, matches CONTRIBUTING's "no floating point for money" spirit since it stays on integer math).

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` directly below `formatMoney`, calling `assertCents(amount)` and building the string with the same whole/fraction logic as `formatMoney` but prefixed with `$` and no trailing currency code.
- `src/index.ts`: no change needed — `export * from "./money.js"` (line 2) already re-exports everything from the module, including the new function.
- `README.md`: extend the "Money" bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`, e.g. "...and `formatCents` to display amounts as `$1,234.56`."
- `test/money.test.ts`: import `formatCents` alongside the existing money imports (line 3-11) and add a `describe("formatCents", ...)` block near the existing `formatMoney` tests (after line 92).

## Stack
1. **money: add formatCents display helper** — single small PR: new function + export (already covered by `index.ts`) + README mention + tests. There's no natural seam to split further; it's one cohesive, reviewable unit.

## Tests
In `test/money.test.ts`, add `describe("formatCents", ...)`:
- `"formats with thousands separators"` — `expect(formatCents(123456)).toBe("$1,234.56")`.
- `"formats negative amounts and small values"` — `expect(formatCents(-5)).toBe("-$0.05")`.
- `"formats zero"` — `expect(formatCents(0)).toBe("$0.00")` (covers the no-sign branch explicitly, per CONTRIBUTING rule 4 on covering every branch).

## Risks
- Low risk: purely additive, no existing exports or call sites change. `assertCents` reuse guarantees the same input validation (throws `ValidationError` on non-integer cents) as the rest of the module, so behavior stays consistent with CONTRIBUTING's money rules.
- Main failure mode would be a sign-placement bug (e.g., `-$0.05` vs `$-0.05`); the negative-value test guards against that.

## Out of scope
- Changing or deprecating `formatMoney`.
- Locale support beyond `en-US` / currencies other than USD.
- Parsing `$`-prefixed strings back into cents (no `parseCents`/`parseMoney` changes).
