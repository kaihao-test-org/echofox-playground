# Contributing

Thanks for helping out. These rules exist because each one has bitten us in
production at least once. Reviewers will hold PRs to them.

## Money

1. **Never use floating point for money.** Amounts are integer cents
   (`Cents`) from the moment they enter the system until they are formatted
   for display. Do not divide by 100 to get dollars, do not use `toFixed`,
   and do not multiply cents by a fractional rate.
2. Percentages are expressed in **basis points** (integers, 1 bp = 0.01%) and
   applied with `percentOf`. If a percentage arrives from a human as "12.5",
   convert it to basis points once at the boundary.
3. Rounding is half away from zero and happens only inside `money.ts`.

## Tests

4. **Every new branch of logic needs a test.** That includes early returns,
   error paths and each arm of a conditional. "It's covered by the happy
   path" is not coverage.
5. Bug fixes start with a failing test that reproduces the bug.
6. Tests should assert on concrete values (ids, amounts), not just on counts
   or lengths.

## Code

7. Throw a subclass of `InvoicingError`, never a bare `Error`, for anything a
   caller might reasonably handle.
8. No `any`. Avoid non-null assertions (`!`) and `as` casts in `src/`;
   handle the `null` / `undefined` case explicitly, even if you "know" it
   can't happen.
9. Anything exported from a module that is part of the public API must be
   re-exported from `src/index.ts` and mentioned in the README.

## Pull requests

10. Keep PRs small and focused. Large changes should be split into a stack
    of PRs, each based on the previous one's branch. Put the position in the
    title, e.g. `tax: extract resolveTaxRate (1/3)`, and list the whole stack
    in each description.
11. Behavior-preserving refactors go in their own PR, separate from behavior
    changes.
12. Run `npm run typecheck && npm test` before pushing.
