import { describe, expect, it } from "vitest";
import { UnknownRegionError, ValidationError } from "../src/errors.js";
import { computeTotals, transitionInvoice } from "../src/invoice.js";
import { invoice, lineItem } from "./fixtures.js";

describe("computeTotals", () => {
  it("computes subtotal, tax and total", () => {
    const totals = computeTotals(
      invoice({
        region: "US-CA",
        lineItems: [
          lineItem({ sku: "A", unitPrice: 4000, quantity: 2 }),
          lineItem({ sku: "B", unitPrice: 2000, quantity: 1 }),
        ],
      }),
    );
    expect(totals).toEqual({
      subtotal: 10_000,
      discount: 0,
      taxableAmount: 10_000,
      tax: 725,
      total: 10_725,
    });
  });

  it("does not tax non-taxable lines", () => {
    const totals = computeTotals(
      invoice({
        region: "GB",
        lineItems: [
          lineItem({ sku: "BOOK", unitPrice: 1500, taxable: false }),
          lineItem({ sku: "PEN", unitPrice: 500 }),
        ],
      }),
    );
    expect(totals.taxableAmount).toBe(500);
    expect(totals.tax).toBe(100);
    expect(totals.total).toBe(2100);
  });

  it("applies discounts to the taxable portion first", () => {
    const totals = computeTotals(
      invoice({
        region: "US-CA",
        lineItems: [
          lineItem({ sku: "A", unitPrice: 6000 }),
          lineItem({ sku: "B", unitPrice: 4000, taxable: false }),
        ],
        discount: { kind: "fixed", amount: 2000 },
      }),
    );
    expect(totals.taxableAmount).toBe(4000);
    expect(totals.tax).toBe(290);
    expect(totals.total).toBe(8290);
  });

  it("never taxes a negative amount", () => {
    const totals = computeTotals(
      invoice({
        lineItems: [
          lineItem({ sku: "A", unitPrice: 1000 }),
          lineItem({ sku: "B", unitPrice: 9000, taxable: false }),
        ],
        discount: { kind: "fixed", amount: 5000 },
      }),
    );
    expect(totals.taxableAmount).toBe(0);
    expect(totals.tax).toBe(0);
  });

  it("rejects invoices without line items", () => {
    expect(() => computeTotals(invoice({ lineItems: [] }))).toThrow(ValidationError);
  });

  it("surfaces unknown regions", () => {
    expect(() => computeTotals(invoice({ region: "XX" }))).toThrow(UnknownRegionError);
  });
});

describe("transitionInvoice", () => {
  it("allows draft -> issued -> paid", () => {
    const issued = transitionInvoice(invoice({ status: "draft" }), "issued");
    expect(transitionInvoice(issued, "paid").status).toBe("paid");
  });

  it("rejects moving a paid invoice", () => {
    expect(() => transitionInvoice(invoice({ status: "paid" }), "void")).toThrow(
      ValidationError,
    );
  });
});
