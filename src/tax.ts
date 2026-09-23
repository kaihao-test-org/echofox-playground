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
 * @throws UnknownRegionError if we have no rate for the region.
 */
export function resolveTaxRate(region: string): number {
  const key = normalizeRegion(region);
  const rateBps = Object.hasOwn(TAX_RATES_BPS, key) ? TAX_RATES_BPS[key] : undefined;
  if (rateBps === undefined) {
    throw new UnknownRegionError(region);
  }
  return rateBps;
}

/**
 * Calculates the tax owed on `taxableAmount` for `region`.
 *
 * @throws UnknownRegionError if we have no rate for the region.
 */
export function calculateTax(taxableAmount: Cents, region: string): Cents {
  return percentOf(taxableAmount, resolveTaxRate(region));
}
