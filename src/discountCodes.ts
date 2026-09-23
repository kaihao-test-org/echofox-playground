import type { Discount } from "./discount.js";
import { InvoicingError, ValidationError } from "./errors.js";
import { assertCents, type Cents } from "./money.js";

/** A promotional code customers can enter at checkout. */
export interface DiscountCode {
  code: string;
  /** Percentage off as entered by marketing, e.g. 15 for 15% or 12.5 for 12.5%. */
  percentOff: number;
  /** Code stops working at this instant. Omit for no expiry. */
  expiresAt?: Date;
  /** Total number of times the code can be redeemed across all customers. */
  maxRedemptions?: number;
  /** Smallest subtotal the code can be applied to. */
  minimumSubtotal?: Cents;
}

export type DiscountCodeRejection = "unknown" | "expired" | "exhausted" | "below_minimum";

export class InvalidDiscountCodeError extends InvoicingError {
  constructor(
    readonly code: string,
    readonly reason: DiscountCodeRejection,
  ) {
    super(`Discount code "${code}" can't be used: ${reason}`);
  }
}

const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * In-memory registry of discount codes and their redemption counts. The
 * billing service keeps one per process and seeds it from the promotions
 * table on boot.
 */
export class DiscountCodeRegistry {
  private readonly codes = new Map<string, DiscountCode>();
  private readonly redemptions = new Map<string, number>();

  register(code: DiscountCode): void {
    const key = normalizeCode(code.code);
    if (!CODE_PATTERN.test(key)) {
      throw new ValidationError(
        `discount code must be 3-32 letters, digits, "-" or "_", got "${code.code}"`,
      );
    }
    if (!(code.percentOff > 0 && code.percentOff <= 100)) {
      throw new ValidationError(
        `percentOff must be greater than 0 and at most 100, got ${code.percentOff}`,
      );
    }
    if (
      code.maxRedemptions !== undefined &&
      (!Number.isInteger(code.maxRedemptions) || code.maxRedemptions < 1)
    ) {
      throw new ValidationError(
        `maxRedemptions must be a positive integer, got ${code.maxRedemptions}`,
      );
    }
    if (code.minimumSubtotal !== undefined) {
      assertCents(code.minimumSubtotal, "minimumSubtotal");
    }
    if (this.codes.has(key)) {
      throw new ValidationError(`discount code ${key} is already registered`);
    }
    this.codes.set(key, { ...code, code: key });
  }

  /**
   * Checks `rawCode` against `subtotal` and records a redemption.
   *
   * Returns a *fixed* discount so the amount is locked in at redemption time.
   * Editing line items afterwards doesn't silently change what the customer
   * was promised.
   */
  redeem(rawCode: string, subtotal: Cents, now: Date = new Date()): Discount {
    assertCents(subtotal, "subtotal");
    const key = normalizeCode(rawCode);
    const code = this.codes.get(key);
    if (code === undefined) {
      throw new InvalidDiscountCodeError(rawCode, "unknown");
    }
    if (code.expiresAt !== undefined && code.expiresAt.getTime() <= now.getTime()) {
      throw new InvalidDiscountCodeError(rawCode, "expired");
    }
    const used = this.redemptions.get(key) ?? 0;
    if (code.maxRedemptions !== undefined && used >= code.maxRedemptions) {
      throw new InvalidDiscountCodeError(rawCode, "exhausted");
    }
    if (code.minimumSubtotal !== undefined && subtotal < code.minimumSubtotal) {
      throw new InvalidDiscountCodeError(rawCode, "below_minimum");
    }

    this.redemptions.set(key, used + 1);
    return {
      kind: "fixed",
      amount: amountOff(subtotal, code.percentOff),
      label: `Code ${key} (${code.percentOff}% off)`,
    };
  }

  redemptionCount(code: string): number {
    return this.redemptions.get(normalizeCode(code)) ?? 0;
  }
}

/** Amount a `percentOff`% code takes off `subtotal`, rounded to the cent. */
function amountOff(subtotal: Cents, percentOff: number): Cents {
  const subtotalDollars = subtotal / 100;
  const discountDollars = subtotalDollars * (percentOff / 100);
  return Math.round(discountDollars * 100);
}
