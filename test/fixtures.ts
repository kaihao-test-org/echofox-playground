import type { Invoice } from "../src/invoice.js";
import type { LineItem } from "../src/lineItem.js";

export function lineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    sku: "WIDGET-1",
    description: "Standard widget",
    unitPrice: 2500,
    quantity: 1,
    ...overrides,
  };
}

let sequence = 0;

export function invoice(overrides: Partial<Invoice> = {}): Invoice {
  sequence += 1;
  return {
    id: `inv_${String(sequence).padStart(4, "0")}`,
    customerId: "cus_acme",
    region: "US-CA",
    currency: "USD",
    lineItems: [lineItem()],
    status: "draft",
    issuedAt: new Date("2024-03-01T12:00:00Z"),
    ...overrides,
  };
}
