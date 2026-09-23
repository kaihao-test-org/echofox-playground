<!-- Echofox plan f8f2b603-e0cf-41ac-a468-d8fad6035e88 revision 1 · sha256 3de768b784a77fca9a0b4a3414e2fb39a1051db435f5a3e5acc327922287a4c5 -->

# Add a formatCents display helper

## Context

`src/money.ts` already has `formatMoney(amount: Cents, currency = "USD")` (money.ts:88-95), which renders `"1,234.56 USD"` — no currency symbol, and the sign lands as a bare `-` prefix, with the currency code trailing. There's no helper that produces a symbol-prefixed US dollar string (`"$1,234.56"`), which is what UI/CLI call sites will typically want to display. `Cents` (money.ts:9) is the existing type for integer minor units, and `assertCents` (money.ts:16-20) is the standard input guard used by every other function in the file. All public API is re-exported through `src/index.ts` via `export * from "./money.js"`, so no separate index change is needed beyond what's already there — it'll pick up the new export automatically.

## Goal

Add `formatCents(cents: Cents): string` to `src/money.ts` that renders integer cents as a US dollar string with thousands separators and a `$` sign placed after the minus sign (e.g. `123456` → `"$1,234.56"`, `-5` → `"-$0.05"`). Verified by unit tests in `test/money.test.ts` covering the two examples plus zero and large values.

## Approach

Mirror the structure of `formatMoney`: validate with `assertCents`, split sign/whole/fraction the same way, but emit `${sign}$${whole}.${fraction}` instead of `${sign}${whole}.${fraction} ${currency}`.

- Rejected: making `formatMoney` take a `symbol` option and having `formatCents` call it — over-engineers a single-currency helper for no current caller; keeping the two functions independent but structurally identical is simpler and matches the file's existing style of small, direct functions.
- Rejected: using `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })` — pulls in locale/currency-formatting semantics (rounding modes, symbol placement rules) that aren't guaranteed to match the exact `-$0.05` shape required, and diverges from the file's existing string-based, floating-point-free approach.

## Changes

- `src/money.ts`: add `formatCents(amount: Cents): string` directly below `formatMoney`, following the same validate → sign → whole → fraction pattern, returning `` `${sign}$${whole}.${fraction}` ``.
- `test/money.test.ts`: import `formatCents` and add a `describe("formatCents", ...)` block.

`src/index.ts` needs no change — `export * from "./money.js"` already re-exports it.

## Stack

1. **Add `formatCents` with tests** — single small, self-contained addition; no other code depends on or is affected by it, so it lands as one PR.

## Tests

In `test/money.test.ts`, new `describe("formatCents", ...)`:
- `"formats with thousands separators"` — `formatCents(123456)` → `"$1,234.56"`.
- `"formats negative small values"` — `formatCents(-5)` → `"-$0.05"`.
- `"formats zero"` — `formatCents(0)` → `"$0.00"`.
- `"rejects fractional cents"` — `() => formatCents(19.99)` throws `ValidationError` (matches `formatMoney`'s existing validation coverage pattern).

## Risks

- Low risk: purely additive, no existing signatures or call sites change. The main risk is a sign/placement mistake (e.g. `$-0.05` instead of `-$0.05`); the negative-value test guards against that directly.

## Out of scope

- No currency-symbol parameter or multi-currency support (task specifies US dollars only).
- No changes to `formatMoney` or any other existing function.
