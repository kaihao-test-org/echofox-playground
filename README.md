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

## Usage

### Build an invoice and compute totals

```ts
import { computeTotals, formatMoney, parseMoney, type Invoice } from "@echofox-playground/invoicing";

const invoice: Invoice = {
  id: "inv_1042",
  customerId: "cus_acme",
  region: "US-CA",
  currency: "USD",
  status: "draft",
  issuedAt: new Date(),
  lineItems: [
    { sku: "SEAT-PRO", description: "Pro seat (monthly)", unitPrice: parseMoney("49.00"), quantity: 12 },
    { sku: "ONBOARD", description: "Onboarding session", unitPrice: parseMoney("250.00"), quantity: 1, taxable: false },
  ],
  discount: { kind: "percentage", basisPoints: 1000, label: "Annual prepay" },
};

const totals = computeTotals(invoice);
formatMoney(totals.subtotal); // "838.00 USD"
formatMoney(totals.discount); // "83.80 USD"
formatMoney(totals.tax);      // "36.55 USD" (7.25% of 504.20 = 36.5545)
formatMoney(totals.total);    // "790.75 USD"
```

The discount comes off the taxable lines first (see [Tax policy](#tax-policy)),
so here tax is charged on 588.00 - 83.80 = 504.20.

### Store and list invoices

```ts
import { InMemoryInvoiceRepository, transitionInvoice } from "@echofox-playground/invoicing";

const repo = new InMemoryInvoiceRepository();
repo.save(invoice);
repo.save(transitionInvoice(repo.getById("inv_1042"), "issued"));

// Newest first, 20 per page by default (max 100).
const page = repo.list({ customerId: "cus_acme", status: "issued", page: 1, pageSize: 50 });
page.items;      // Invoice[]
page.totalPages; // for "Page 1 of N"
```

The repository stores copies, so mutating an invoice you loaded doesn't
change what's stored until you `save` it again.

### Handle errors

Everything the library throws on purpose extends `InvoicingError`:

| Error                | When                                                   |
| -------------------- | ------------------------------------------------------ |
| `ValidationError`    | Bad input: fractional cents, empty SKU, bad page size  |
| `UnknownRegionError` | No tax rate configured for the invoice's region        |
| `NotFoundError`      | `getById` with an id that isn't stored                 |

```ts
import { InvoicingError, UnknownRegionError } from "@echofox-playground/invoicing";

try {
  computeTotals(invoice);
} catch (err) {
  if (err instanceof UnknownRegionError) {
    // err.region is the region as it was passed in
  } else if (err instanceof InvoicingError) {
    // other expected failures
  } else {
    throw err;
  }
}
```

## Concepts

- **Money** is always an integer number of cents (`Cents`). Use `parseMoney`
  to read user input and `formatMoney` to display amounts. Percentages are
  applied with `percentOf(amount, basisPoints)`, where 725 bps = 7.25%.
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
