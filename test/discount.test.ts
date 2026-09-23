import { describe, expect, it } from "vitest";
import { discountAmount } from "../src/discount.js";
import { ValidationError } from "../src/errors.js";

describe("discountAmount", () => {
  it("returns zero without a discount", () => {
    expect(discountAmount(10_000, undefined)).toBe(0);
  });

  it("applies a fixed discount", () => {
    expect(discountAmount(10_000, { kind: "fixed", amount: 1500 })).toBe(1500);
  });

  it("applies a percentage discount in basis points", () => {
    expect(discountAmount(10_000, { kind: "percentage", basisPoints: 1250 })).toBe(1250);
  });

  it("never discounts more than the subtotal", () => {
    expect(discountAmount(1000, { kind: "fixed", amount: 5000 })).toBe(1000);
  });

  it("returns zero for an empty subtotal", () => {
    expect(discountAmount(0, { kind: "percentage", basisPoints: 5000 })).toBe(0);
  });

  it.each([
    { kind: "fixed", amount: -1 } as const,
    { kind: "fixed", amount: 1.5 } as const,
    { kind: "percentage", basisPoints: 10_001 } as const,
    { kind: "percentage", basisPoints: 12.5 } as const,
  ])("rejects %j", (discount) => {
    expect(() => discountAmount(10_000, discount)).toThrow(ValidationError);
  });
});
