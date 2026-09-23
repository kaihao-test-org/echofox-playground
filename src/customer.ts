import { randomUUID } from "node:crypto";
import { ValidationError } from "./errors.js";

export interface Customer {
  id: string;
  name: string;
  email: string;
  /** Billing region, e.g. "US-CA" or "DE". Drives the tax rate on invoices. */
  region: string;
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
  return {
    id,
    name,
    email,
    region: input.region.trim().toUpperCase(),
  };
}
