import { describe, expect, it } from "vitest";
import { createCustomer, type Customer } from "../src/customer.js";
import { estimateTax, isTaxExempt } from "../src/exemptions.js";

const asOf = new Date("2024-06-01T00:00:00Z");

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    ...createCustomer({ name: "Acme", email: "billing@acme.test", region: "US-CA" }, "cus_acme"),
    ...overrides,
  };
}

describe("isTaxExempt", () => {
  it("is false without an exemption", () => {
    expect(isTaxExempt(customer(), asOf)).toBe(false);
  });

  it("is true for an exemption without expiry", () => {
    expect(isTaxExempt(customer({ taxExemption: { certificateId: "CA-RESALE-1" } }), asOf)).toBe(
      true,
    );
  });

  it("is true before the exemption expires", () => {
    const c = customer({
      taxExemption: { certificateId: "CA-RESALE-1", expiresAt: new Date("2024-12-31") },
    });
    expect(isTaxExempt(c, asOf)).toBe(true);
  });

  it("is false once the exemption has expired", () => {
    const c = customer({
      taxExemption: { certificateId: "CA-RESALE-1", expiresAt: new Date("2024-01-01") },
    });
    expect(isTaxExempt(c, asOf)).toBe(false);
  });

  it("treats the expiry instant as expired", () => {
    const c = customer({ taxExemption: { certificateId: "CA-RESALE-1", expiresAt: asOf } });
    expect(isTaxExempt(c, asOf)).toBe(false);
  });
});

describe("estimateTax", () => {
  it("charges the region's rate to non-exempt customers", () => {
    expect(estimateTax(customer(), 10_000, asOf)).toEqual({
      exempt: false,
      rateBps: 725,
      tax: 725,
    });
  });

  it("charges nothing to exempt customers", () => {
    const c = customer({ taxExemption: { certificateId: "CA-RESALE-1" } });
    expect(estimateTax(c, 10_000, asOf)).toEqual({ exempt: true, rateBps: 0, tax: 0 });
  });

  it("handles zero-rate regions", () => {
    expect(estimateTax(customer({ region: "US-OR" }), 10_000, asOf).tax).toBe(0);
  });
});
