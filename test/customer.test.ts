import { describe, expect, it } from "vitest";
import { createCustomer } from "../src/customer.js";
import { ValidationError } from "../src/errors.js";

describe("createCustomer", () => {
  it("normalizes input", () => {
    const customer = createCustomer(
      { name: "  Acme Corp ", email: "Billing@Acme.test", region: "us-ca" },
      "cus_1",
    );
    expect(customer).toEqual({
      id: "cus_1",
      name: "Acme Corp",
      email: "billing@acme.test",
      region: "US-CA",
    });
  });

  it("generates an id when none is given", () => {
    const customer = createCustomer({ name: "Acme", email: "a@acme.test", region: "DE" });
    expect(customer.id).toMatch(/^cus_/);
  });

  it("requires a name", () => {
    expect(() => createCustomer({ name: " ", email: "a@acme.test", region: "DE" })).toThrow(
      ValidationError,
    );
  });

  it("rejects malformed emails", () => {
    expect(() => createCustomer({ name: "Acme", email: "acme", region: "DE" })).toThrow(
      ValidationError,
    );
  });

  it("keeps a tax exemption", () => {
    const expiresAt = new Date("2025-01-01T00:00:00Z");
    const customer = createCustomer({
      name: "Acme",
      email: "a@acme.test",
      region: "US-CA",
      taxExemption: { certificateId: " CA-RESALE-1 ", expiresAt },
    });
    expect(customer.taxExemption).toEqual({ certificateId: "CA-RESALE-1", expiresAt });
    expect(customer.taxExemption?.expiresAt).not.toBe(expiresAt);
  });

  it("requires a certificate id for exemptions", () => {
    expect(() =>
      createCustomer({
        name: "Acme",
        email: "a@acme.test",
        region: "US-CA",
        taxExemption: { certificateId: "  " },
      }),
    ).toThrow(ValidationError);
  });
});
