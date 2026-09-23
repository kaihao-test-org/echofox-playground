import { randomUUID } from "node:crypto";
import { ValidationError } from "./errors.js";
import { normalizeRegion, resolveTaxRate } from "./tax.js";

/**
 * A resale / non-profit exemption certificate on file for a customer.
 * Finance verifies the certificate before it's attached.
 */
export interface TaxExemption {
  certificateId: string;
  /** Exemption stops applying at this instant. Omit for no expiry. */
  expiresAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  /** Billing region, e.g. "US-CA" or "DE". Drives the tax rate on invoices. */
  region: string;
  taxExemption?: TaxExemption;
}

export type NewCustomer = Omit<Customer, "id">;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createCustomer(input: NewCustomer, id: string = `cus_${randomUUID()}`): Customer {
  const name = input.name.trim();
  if (name === "") {
    throw new ValidationError("customer name is required");
  }
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new ValidationError(`invalid customer email: "${input.email}"`);
  }

  const region = normalizeRegion(input.region);
  // Exempt customers never go through calculateTax(), so an unsupported
  // region would otherwise go unnoticed until the exemption lapses.
  // resolveTaxRate() throws UnknownRegionError for regions we can't tax.
  resolveTaxRate(region);

  const customer: Customer = { id, name, email, region };
  if (input.taxExemption !== undefined) {
    customer.taxExemption = validateExemption(input.taxExemption);
  }
  return customer;
}

function validateExemption(exemption: TaxExemption): TaxExemption {
  const certificateId = exemption.certificateId.trim();
  if (certificateId === "") {
    throw new ValidationError("tax exemption requires a certificate id");
  }
  return exemption.expiresAt === undefined
    ? { certificateId }
    : { certificateId, expiresAt: new Date(exemption.expiresAt.getTime()) };
}
