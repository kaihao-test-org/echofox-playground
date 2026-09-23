import type { Customer } from "./customer.js";
import { discountAmount, type Discount } from "./discount.js";
import { ValidationError } from "./errors.js";
import { isTaxExempt } from "./exemptions.js";
import { sumLineItems, sumTaxableLineItems, type LineItem } from "./lineItem.js";
import { addMoney, subtractMoney, ZERO, type Cents } from "./money.js";
import { calculateTax } from "./tax.js";

export type InvoiceStatus = "draft" | "issued" | "paid" | "void";

export interface Invoice {
  id: string;
  customerId: string;
  /** Billing region captured when the invoice was created. */
  region: string;
  currency: string;
  lineItems: LineItem[];
  discount?: Discount;
  status: InvoiceStatus;
  issuedAt: Date;
}

export interface InvoiceTotals {
  subtotal: Cents;
  discount: Cents;
  taxableAmount: Cents;
  tax: Cents;
  total: Cents;
}

/**
 * Computes invoice totals. Pass the invoice's customer to apply their tax
 * exemption; exemptions are evaluated as of the invoice's `issuedAt`.
 */
export function computeTotals(invoice: Invoice, customer?: Customer): InvoiceTotals {
  if (invoice.lineItems.length === 0) {
    throw new ValidationError(`invoice ${invoice.id} has no line items`);
  }
  if (customer !== undefined && customer.id !== invoice.customerId) {
    throw new ValidationError(
      `customer ${customer.id} does not own invoice ${invoice.id}`,
    );
  }
  const subtotal = sumLineItems(invoice.lineItems);
  const taxableSubtotal = sumTaxableLineItems(invoice.lineItems);
  const discount = discountAmount(subtotal, invoice.discount);

  // Discounts reduce the taxable portion first. This matches how finance
  // files returns today; see README "Tax policy" before changing it.
  const taxableAmount = Math.max(ZERO, subtractMoney(taxableSubtotal, discount));
  const exempt = customer !== undefined && isTaxExempt(customer, invoice.issuedAt);
  const tax = exempt ? ZERO : calculateTax(taxableAmount, invoice.region);

  return {
    subtotal,
    discount,
    taxableAmount,
    tax,
    total: addMoney(subtractMoney(subtotal, discount), tax),
  };
}

/** Status transitions an invoice is allowed to make. */
const TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  draft: ["issued", "void"],
  issued: ["paid", "void"],
  paid: [],
  void: [],
};

export function transitionInvoice(invoice: Invoice, next: InvoiceStatus): Invoice {
  if (!TRANSITIONS[invoice.status].includes(next)) {
    throw new ValidationError(
      `invoice ${invoice.id} cannot move from ${invoice.status} to ${next}`,
    );
  }
  return { ...invoice, status: next };
}
