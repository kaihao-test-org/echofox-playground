import { ValidationError } from "./errors.js";
import { addMoney, assertCents, multiplyMoney, type Cents } from "./money.js";

export interface LineItem {
  sku: string;
  description: string;
  unitPrice: Cents;
  quantity: number;
  /** Whether sales tax applies to this line. Defaults to `true`. */
  taxable?: boolean;
}

export function validateLineItem(item: LineItem): void {
  if (item.sku.trim() === "") {
    throw new ValidationError("line item sku is required");
  }
  assertCents(item.unitPrice, `unitPrice for ${item.sku}`);
  if (item.unitPrice < 0) {
    throw new ValidationError(`unitPrice for ${item.sku} must not be negative`);
  }
  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    throw new ValidationError(
      `quantity for ${item.sku} must be a positive integer, got ${item.quantity}`,
    );
  }
}

export function lineTotal(item: LineItem): Cents {
  validateLineItem(item);
  return multiplyMoney(item.unitPrice, item.quantity);
}

export function isTaxable(item: LineItem): boolean {
  return item.taxable !== false;
}

export function sumLineItems(items: readonly LineItem[]): Cents {
  return addMoney(...items.map(lineTotal));
}

export function sumTaxableLineItems(items: readonly LineItem[]): Cents {
  return sumLineItems(items.filter(isTaxable));
}
