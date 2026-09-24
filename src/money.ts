import { ValidationError } from "./errors.js";

/**
 * Money is always an integer number of minor units (cents for USD/EUR/GBP).
 *
 * Never convert to a floating point number of dollars to do arithmetic.
 * Use the helpers in this module instead; see CONTRIBUTING.md.
 */
export type Cents = number;

export const ZERO: Cents = 0;

/** Number of basis points in 100%. 1 bp = 0.01%, so 725 bps = 7.25%. */
export const BPS_PER_WHOLE = 10_000;

export function assertCents(value: number, label = "amount"): void {
  if (!Number.isSafeInteger(value)) {
    throw new ValidationError(`${label} must be an integer number of cents, got ${value}`);
  }
}

/** Validates and returns `value` as cents. */
export function cents(value: number): Cents {
  assertCents(value);
  return value;
}

/**
 * Parses a decimal string such as "12.34", "-0.5" or "1999" into cents.
 * Parsing is done on the string itself so no floating point is involved.
 */
export function parseMoney(input: string): Cents {
  const match = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match) {
    throw new ValidationError(`Invalid money amount: "${input}"`);
  }
  const [, sign, whole, fraction = ""] = match;
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  assertCents(value);
  return sign && value !== 0 ? -value : value;
}

export function addMoney(...amounts: Cents[]): Cents {
  let total = ZERO;
  for (const amount of amounts) {
    assertCents(amount);
    total += amount;
  }
  assertCents(total, "sum");
  return total;
}

export function subtractMoney(a: Cents, b: Cents): Cents {
  assertCents(a);
  assertCents(b);
  return a - b;
}

export function multiplyMoney(amount: Cents, quantity: number): Cents {
  assertCents(amount);
  if (!Number.isSafeInteger(quantity)) {
    throw new ValidationError(`quantity must be an integer, got ${quantity}`);
  }
  const product = amount * quantity;
  assertCents(product, "product");
  return product;
}

/**
 * Returns `basisPoints / 10_000` of `amount`, rounded half away from zero.
 *
 * This is the only place percentages are applied to money. It works on
 * integers throughout: the division result is truncated and the remainder
 * decides the rounding, so there is no floating point drift.
 */
export function percentOf(amount: Cents, basisPoints: number): Cents {
  assertCents(amount);
  const product = amount * basisPoints;
  const quotient = Math.trunc(product / BPS_PER_WHOLE);
  const remainder = product - quotient * BPS_PER_WHOLE;
  if (Math.abs(remainder) * 2 >= BPS_PER_WHOLE) {
    return quotient + Math.sign(product);
  }
  return quotient;
}

function splitForDisplay(amount: Cents): { sign: string; whole: string; fraction: string } {
  assertCents(amount);
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const whole = Math.floor(abs / 100).toLocaleString("en-US");
  const fraction = String(abs % 100).padStart(2, "0");
  return { sign, whole, fraction };
}

/** Formats cents for display, e.g. `formatMoney(123456)` -> "1,234.56 USD". */
export function formatMoney(amount: Cents, currency = "USD"): string {
  const { sign, whole, fraction } = splitForDisplay(amount);
  return `${sign}${whole}.${fraction} ${currency}`;
}

/** Formats cents as a US dollar string, e.g. `formatCents(123456)` -> "$1,234.56". */
export function formatCents(amount: Cents): string {
  const { sign, whole, fraction } = splitForDisplay(amount);
  return `${sign}$${whole}.${fraction}`;
}
