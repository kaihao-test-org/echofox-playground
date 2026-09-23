<!-- Echofox plan b7f40f2e-533a-479e-bd3a-891ecf40db4e revision 1 · sha256 de671e468ca292046b1932a32a2c40eea9c3717d29d47243ed92c169c38c1386 -->

# Add a formatCents display helper

## Context
`src/money.ts` already has `formatMoney(amount: Cents, currency = "USD")`, which formats cents as `"1,234.56 USD"` using `toLocaleString("en-US")` for the thousands separator on the whole-dollar part (src/money.ts:88-95). There is no helper that renders a plain `$`-prefixed US dollar string (e.g. for UI labels that don't want a trailing currency code). The task asks for a new `formatCents(cents: Cents): string` that produces `"$1,234.56"` / `"-$0.05"`, following the same rounding-free, integer-cents discipline documented in `CONTRIBUTING.md` ("Never use floating point for money", "no `toFixed`").

Per `CONTRIBUTING.md` rule 9, anything exported from a module must be re-exported from `src/index.ts` and mentioned in the README; `src/index.ts:2` already does `export * from "./money.js"`, so `formatCents` needs no new export line there, but the README's "Money" bullet (README.md:23-25) currently only mentions `parseMoney`/`formatMoney` and should be updated.

## Goal
`formatCents(123456)` returns `"$1,234.56"` and `formatCents(-5)` returns `"-$0.05"`. Success is: new unit tests in `test/money.test.ts` pass, `npm run typecheck && npm test` pass, and the function is reachable via the package's public entry point (`src/index.ts`).

## Approach
- Implement `formatCents` by reusing the same sign/whole/fraction decomposition as `formatMoney`, but prefix `$` before the sign-adjusted number instead of appending a currency code, and validate input with `assertCents` exactly like every other function in the module.
- Place the sign before the `$` for negative values (`"-$0.05"`, not `"$-0.05"`), matching the example in the task.
- **Rejected: implement via `formatMoney(amount).replace(...)`.** Reformatting a string is fragile and couples the two functions' output formats together; a few extra lines of straightforward arithmetic is clearer and matches the existing style of `formatMoney`.
- **Rejected: use `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`.** It's tempting and would also handle the `$`/thousands/decimals, but it operates on a float number of dollars (`cents / 100`), which conflicts with the codebase's stated rule of never converting cents to floating-point dollars for formatting. Sticking to the existing integer whole/fraction split avoids that entirely.

## Changes
- `src/money.ts`: add `formatCents(amount: Cents): string` directly below `formatMoney`, with a one-line doc comment showing an example (matching the style of the existing `formatMoney` comment at line 87). Reuses `assertCents`, sign/abs/whole/fraction logic.
- `src/index.ts`: no change needed — `export * from "./money.js"` already re-exports it.
- `README.md`: extend the "Money" bullet (README.md:23-25) to mention `formatCents` alongside `formatMoney`, e.g. "...`formatMoney` to display amounts with a currency code, or `formatCents` for a plain `$`-prefixed string."
- `test/money.test.ts`: import `formatCents` in the existing import block (test/money.test.ts:3-11) and add a `describe("formatCents", ...)` block near the existing `formatMoney` tests.

## Stack
1. **money: add formatCents display helper** — single PR: adds the function, its README mention, and its tests. Small enough that splitting further would be pure overhead.

## Tests
In `test/money.test.ts`, new `describe("formatCents", ...)`:
- `"formats with thousands separators"` — `expect(formatCents(123456)).toBe("$1,234.56")`.
- `"formats negative amounts and small values"` — `expect(formatCents(-5)).toBe("-$0.05")`.
- `"formats zero"` — `expect(formatCents(0)).toBe("$0.00")`, covering the boundary not exercised by the two examples above.
- `"rejects non-integer cents"` — `expect(() => formatCents(19.99)).toThrow(ValidationError)`, exercising the `assertCents` guard per CONTRIBUTING rule 4 (every branch needs a test, including the error path).

## Risks
- **Sign/`$` placement bug** (`"$-0.05"` instead of `"-$0.05"`) — guarded by the explicit negative-value test.
- **Off-by-one in padding for sub-dollar amounts** (`-5` cents → must be `0.05`, not `0.5`) — guarded by the small-value test, mirroring the existing `formatMoney` coverage.
- **Divergence from `formatMoney`'s rounding/validation behavior** — mitigated by reusing `assertCents` and the same whole/fraction split, so both functions stay consistent for the same input.

## Out of scope
- Changing `formatMoney`'s existing signature or output format.
- Locale/currency parameterization for `formatCents` (task only asks for US dollars).
- Any UI code that would consume `formatCents`.
