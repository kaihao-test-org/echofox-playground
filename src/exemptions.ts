import type { Customer } from "./customer.js";
import { percentOf, ZERO, type Cents } from "./money.js";
import { resolveTaxRate } from "./tax.js";

/** Whether `customer` holds a tax exemption that is valid at `asOf`. */
export function isTaxExempt(customer: Customer, asOf: Date = new Date()): boolean {
  const exemption = customer.taxExemption;
  if (exemption === undefined) {
    return false;
  }
  return exemption.expiresAt === undefined || exemption.expiresAt.getTime() > asOf.getTime();
}

export interface TaxEstimate {
  exempt: boolean;
  /** Rate that was applied, in basis points. 0 for exempt customers. */
  rateBps: number;
  tax: Cents;
}

/**
 * Estimates tax on a prospective purchase for the checkout preview, before an
 * invoice exists. Returns the rate too so the UI can render "Tax (7.25%)".
 */
export function estimateTax(
  customer: Customer,
  amount: Cents,
  asOf: Date = new Date(),
): TaxEstimate {
  if (isTaxExempt(customer, asOf)) {
    return { exempt: true, rateBps: 0, tax: ZERO };
  }
  // createCustomer() rejects regions we have no rate for, so the lookup
  // can't miss for a customer that exists.
  const rateBps = resolveTaxRate(customer.region)!;
  return { exempt: false, rateBps, tax: percentOf(amount, rateBps) };
}
