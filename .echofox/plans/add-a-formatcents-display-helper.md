<!-- Echofox plan d79eb75f-e486-4f68-b003-b181c07dcdcf revision 1 · sha256 9e49943837aad09fd272896d0c537a6262d64a69de523a769856d4b6988b657a -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency = "USD")`, which formats cents as `"1,234.56 USD"` using `Math.floor`, `%`, and `toLocaleString("en-US")` for the thousands separator (src/money.ts:88-95). Callers who want a plain US-dollar string with a `$` prefix (e.g. UI display) have no helper for that shape today. `src/index.ts` re-exports everything from `money.ts` via `export * from "./money.js"` (src/index.ts:2), so any new export from `money.ts` is automatically part of the public API surface. CONTRIBUTING.md requires: a test for every branch (rule 4), concrete-value assertions (rule 6), no floating point for money (rule 1), and that public exports be re-exported from `index.ts` and mentioned in the README (rule 9) — README.md:23-25 already documents `formatMoney` in the "Money" bullet.

## Goal
Add `formatCents(cents: Cents): string` that renders integer cents as a US dollar string with thousands separators and a `$` sign, e.g. `123456 → "$1,234.56"` and `-5 → "-$0.05"`. Success: `npm run typecheck && npm test` pass, new tests cover the sign/thousands-separator/small-value branches, and the function is reachable via `import { formatCents } from "../src/index.js"`.

## Approach
Implement `formatCents` in `src/money.ts` by reusing the same integer-only sign/whole/fraction logic as `formatMoney`, just fixed to USD and with `$` placed after the sign instead of a trailing currency code.
- Reject implementing it as a wrapper like `` `$${formatMoney(cents)}` `` — rejected because `formatMoney`'s output puts the currency code at the end (`"1,234.56 USD"`), not a `$` prefix before the sign, so string-splicing it would misplace the sign for negative amounts (`"-$1,234.56"` needs sign before `$`, not `$-1,234.56`).
- Reject adding a `currency`/`symbol` parameter to generalize — rejected, task only asks for USD display; keep it a single small function.
- No change to `src/index.ts` needed: it already does `export * from "./money.js"`, so `formatCents` is exported automatically once added to `money.ts`. (Confirmed by reading src/index.ts:2.)

## Changes
- `src/money.ts`: add `formatCents(cents: Cents): string` next to `formatMoney`, following the same integer-arithmetic pattern (`assertCents`, `Math.abs`, `Math.floor(abs / 100).toLocaleString("en-US")`, `String(abs % 100).padStart(2, "0")`), producing `` `${sign}$${whole}.${fraction}` ``.
- `test/money.test.ts`: add a `describe("formatCents", ...)` block with cases for thousands separators, negative sign placement, and a small value under a dollar; import `formatCents` alongside the existing named imports.
- `README.md`: extend the existing "Money" bullet (README.md:23-25) to also mention `formatCents` for US-dollar display, satisfying CONTRIBUTING.md rule 9.

## Stack
1. **Add formatCents display helper** — implementation, tests, and README mention land together since this is a single small, additive function with no callers to update; splitting it further would leave an untested or undocumented export in an intermediate state.

## Tests
In `test/money.test.ts`, `describe("formatCents", ...)`:
- `"formats with thousands separators"`: `formatCents(123456)` → `"$1,234.56"`.
- `"formats negative amounts with the sign before the dollar sign"`: `formatCents(-5)` → `"-$0.05"`.
- `"formats a value under one dollar"`: e.g. `formatCents(9)` → `"$0.09"`, to exercise the `padStart` branch distinctly from the thousands-separator case.

## Risks
- Sign/`$` placement bug for negative values is the main risk (matching `-$0.05` exactly rather than `$-0.05`); guarded by an explicit test asserting the exact string.
- `README.md`/`CONTRIBUTING.md` rule 9 (export must be documented) is easy to miss silently since nothing enforces it automatically; guarded by explicitly updating the README bullet in this PR.

## Out of scope
- Locale/currency parameterization of `formatCents` (only USD `$` is requested).
- Changing or deprecating `formatMoney`.
- Parsing `$`-prefixed strings back into cents.
