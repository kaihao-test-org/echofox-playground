import { ValidationError } from "./errors.js";
import { assertCents, BPS_PER_WHOLE, percentOf, ZERO, type Cents } from "./money.js";

export type Discount =
  | { kind: "fixed"; amount: Cents; label?: string }
  | { kind: "percentage"; basisPoints: number; label?: string };

export function validateDiscount(discount: Discount): void {
  switch (discount.kind) {
    case "fixed":
      assertCents(discount.amount, "discount amount");
      if (discount.amount < 0) {
        throw new ValidationError("discount amount must not be negative");
      }
      return;
    case "percentage":
      if (
        !Number.isInteger(discount.basisPoints) ||
        discount.basisPoints < 0 ||
        discount.basisPoints > BPS_PER_WHOLE
      ) {
        throw new ValidationError(
          `discount basisPoints must be an integer between 0 and ${BPS_PER_WHOLE}, got ${discount.basisPoints}`,
        );
      }
      return;
  }
}

/**
 * Returns how much to take off `subtotal`. The result is never negative and
 * never larger than the subtotal, so a discount can't produce a credit.
 */
export function discountAmount(subtotal: Cents, discount: Discount | undefined): Cents {
  assertCents(subtotal, "subtotal");
  if (discount === undefined || subtotal <= 0) {
    return ZERO;
  }
  validateDiscount(discount);
  const raw =
    discount.kind === "fixed" ? discount.amount : percentOf(subtotal, discount.basisPoints);
  return Math.min(raw, subtotal);
}
