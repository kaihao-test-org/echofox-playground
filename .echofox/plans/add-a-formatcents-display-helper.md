<!-- Echofox plan c22cafd6-f809-49ca-b81c-ebc3dda090ee revision 1 · sha256 8b927aef238c1cc905931c0d978678676f07bf6898d2b2f5fab5e8926df2f2ab -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount, currency)` (src/money.ts:88) which renders cents as `"1,234.56 USD"` using `toLocaleString("en-US")` for thousands separators. There is no US-dollar-sign variant. The task asks for `formatCents(cents: Cents): string` that renders as `"$1,234.56"` / `"-$0.05"` (sign before the `$`, no currency code). `src/index.ts` re-exports everything from `./money.js` via `export * from "./money.js"` (src/index.ts:2), so a new named export there is picked up automatically — no index.ts edit needed for the export itself, but the task explicitly says to export it from index.ts, which the wildcard already satisfies (verify, don't add redundant lines).

## Goal
`formatCents` is available from both `src/money.ts` and the package root (`src/index.ts`), formats integer cents as a US dollar string with thousands separators and the sign before the `$`, and matches the two examples given (`123456` → `"$1,234.56"`, `-5` → `"-$0.05"`). Verified by new unit tests in `test/money.test.ts` and `npm test` passing.

## Approach
Implement `formatCents` by reusing the existing whole/fraction splitting logic from `formatMoney`, but placing `$` after the sign and before the digits, with no currency suffix. Key decision: keep it a thin sibling function next to `formatMoney` rather than refactoring `formatMoney` to call it (or vice versa), since the two produce differently-shaped strings ("$1,234.56" vs "1,234.56 USD") and sharing an implementation would need a formatting-options parameter that adds complexity for a one-off helper — rejected in favor of duplicating the ~4 lines of formatting logic, matching the codebase's existing style of small standalone functions in this file.

Alternative rejected: use `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`. Pulls in a heavier, less explicit dependency than the string-based approach already used by `formatMoney`; staying consistent with the existing hand-rolled formatting keeps behavior and rounding fully explicit and avoids locale/ICU edge cases.

## Changes
- `src/money.ts`: add `export function formatCents(amount: Cents): string` directly below `formatMoney` (after line 95). Validate with `assertCents(amount)`, compute `sign`, `abs`, `whole` (via `Math.floor(abs / 100).toLocaleString("en-US")`), `fraction` (via `String(abs % 100).padStart(2, "0")`), and return `` `${sign}$${whole}.${fraction}` ``. Add a one-line doc comment with the example, matching the style of the `formatMoney` comment on src/money.ts:87.
- `src/index.ts`: no line changes needed — `export * from "./money.js"` already re-exports `formatCents` once it exists in money.ts. Call this out in the PR description rather than adding a redundant named export.
- `test/money.test.ts`: add `formatCents` to the import list from `../src/money.js` (test/money.test.ts:3-11) and add a new `describe("formatCents", ...)` block alongside the existing `formatMoney` block (after line 92).

## Stack
1. **Add formatCents display helper with tests** — implement the function in `src/money.ts`, confirm it's exported via `src/index.ts`'s wildcard, and add tests in `test/money.test.ts`; single PR since it's a small, additive, non-breaking helper with no dependents yet.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)` block:
- `"formats with a dollar sign and thousands separators"`: `expect(formatCents(123456)).toBe("$1,234.56")`.
- `"formats negative amounts with the sign before the dollar sign"`: `expect(formatCents(-5)).toBe("-$0.05")`.
- `"formats zero"`: `expect(formatCents(0)).toBe("$0.00")` — guards the boundary between positive and negative formatting.
- `"rejects non-integer cents"`: `expect(() => formatCents(19.99)).toThrow(ValidationError)` — confirms `assertCents` validation is wired in, consistent with `formatMoney`'s implicit validation.

## Risks
- Low risk: purely additive, no existing exports or call sites change. The main risk is a sign/placement mistake (e.g. `$-0.05` instead of `-$0.05`), which the negative-value test directly guards against.
- Duplicating formatting logic from `formatMoney` risks drift if one is changed and not the other; acceptable here since the two functions produce different string shapes, but worth a one-line comment noting the intentional similarity if a reviewer flags it.

## Out of scope
- Changing or refactoring `formatMoney`.
- Supporting currencies other than USD in `formatCents` (name and task explicitly scope it to `$`).
- Locale-configurable formatting or `Intl`-based implementation.
