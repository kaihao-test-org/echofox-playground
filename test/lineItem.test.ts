import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import { lineTotal, sumLineItems, sumTaxableLineItems } from "../src/lineItem.js";
import { lineItem } from "./fixtures.js";

describe("lineTotal", () => {
  it("multiplies unit price by quantity", () => {
    expect(lineTotal(lineItem({ unitPrice: 1999, quantity: 3 }))).toBe(5997);
  });

  it.each([
    ["an empty sku", { sku: "  " }],
    ["a fractional price", { unitPrice: 19.99 }],
    ["a negative price", { unitPrice: -100 }],
    ["a zero quantity", { quantity: 0 }],
    ["a fractional quantity", { quantity: 1.5 }],
  ])("rejects %s", (_, overrides) => {
    expect(() => lineTotal(lineItem(overrides))).toThrow(ValidationError);
  });
});

describe("sums", () => {
  const items = [
    lineItem({ sku: "A", unitPrice: 1000, quantity: 2 }),
    lineItem({ sku: "B", unitPrice: 500, quantity: 1, taxable: false }),
    lineItem({ sku: "C", unitPrice: 250, quantity: 4, taxable: true }),
  ];

  it("sums every line", () => {
    expect(sumLineItems(items)).toBe(3500);
  });

  it("sums only taxable lines", () => {
    expect(sumTaxableLineItems(items)).toBe(3000);
  });
});
