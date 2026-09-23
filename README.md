# invoicing

Small TypeScript library for building invoices: integer-cent money helpers,
line items, discounts, sales tax / VAT and invoice totals, plus an in-memory
repository for tests and local development.

It backs the billing service and the admin dashboard. It has no runtime
dependencies.

## Getting started

```sh
npm install
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # emits dist/
```

Node 20+ is required.

## Concepts

- **Money** is always an integer number of cents (`Cents`). Use `parseMoney`
  to read user input and `formatMoney` to display amounts, or `formatCents`
  to display amounts as `$1,234.56`. Percentages are applied with
  `percentOf(amount, basisPoints)`, where 725 bps = 7.25%.
- **Line items** carry a `unitPrice` in cents and an integer `quantity`.
  Lines are taxable unless `taxable: false` is set.
- **Discounts** are either `fixed` (cents) or `percentage` (basis points) and
  can never exceed the subtotal.
- **Tax** rates live in `TAX_RATES_BPS`, keyed by region code (`US-CA`, `DE`,
  ...). `calculateTax` throws `UnknownRegionError` for regions we don't have
  a rate for.
- **Invoices** move `draft -> issued -> paid`, and can be voided before they
  are paid.

## Tax policy

Discounts are applied to the taxable portion of an invoice first. This is
what finance files today; talk to them before changing `computeTotals`.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
