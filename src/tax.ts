import { UnknownRegionError } from "./errors.js";
import { percentOf, type Cents } from "./money.js";

/**
 * Sales tax / VAT rates in basis points (1 bp = 0.01%).
 *
 * Keys are upper-case region codes: ISO 3166-2 for US states ("US-CA") and
 * ISO 3166-1 alpha-2 for countries ("DE"). Rates are reviewed by finance
 * each quarter; don't change them without a link to the source.
 */
export const TAX_RATES_BPS: Readonly<Record<string, number>> = Object.freeze({
  "US-CA": 725,
  "US-NY": 400,
  "US-TX": 625,
  "US-WA": 650,
  "US-OR": 0,
  GB: 2000,
  DE: 1900,
  FR: 2000,
  IE: 2300,
});

export function supportedRegions(): string[] {
  return Object.keys(TAX_RATES_BPS).sort();
}

/** Canonical form of a region code: trimmed and upper-cased. */
export function normalizeRegion(region: string): string {
  return region.trim().toUpperCase();
}

/**
 * Looks up the tax rate for `region`, in basis points.
 *
 * Returns `null` when we have no rate for the region. A missing rate is an
 * expected case for some callers (e.g. quoting a prospect in a region we
 * haven't registered in yet), so it's up to the caller to decide whether
 * that's an error.
 */
export function resolveTaxRate(region: string): number | null {
  const key = normalizeRegion(region);
  if (!Object.hasOwn(TAX_RATES_BPS, key)) {
    return null;
  }
  return TAX_RATES_BPS[key] ?? null;
}

/**
 * Calculates the tax owed on `taxableAmount` for `region`.
 *
 * @throws UnknownRegionError if we have no rate for the region.
 */
export function calculateTax(taxableAmount: Cents, region: string): Cents {
  const rateBps = resolveTaxRate(region);
  if (rateBps === null) {
    throw new UnknownRegionError(region);
  }
  return percentOf(taxableAmount, rateBps);
}
