import { discountAmount, type Discount } from "./discount.js";
import { ValidationError } from "./errors.js";
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

export function computeTotals(invoice: Invoice): InvoiceTotals {
  if (invoice.lineItems.length === 0) {
    throw new ValidationError(`invoice ${invoice.id} has no line items`);
  }
  const subtotal = sumLineItems(invoice.lineItems);
  const taxableSubtotal = sumTaxableLineItems(invoice.lineItems);
  const discount = discountAmount(subtotal, invoice.discount);

  // Discounts reduce the taxable portion first. This matches how finance
  // files returns today; see README "Tax policy" before changing it.
  const taxableAmount = Math.max(ZERO, subtractMoney(taxableSubtotal, discount));
  const tax = calculateTax(taxableAmount, invoice.region);

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
