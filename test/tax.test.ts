import { describe, expect, it } from "vitest";
import { UnknownRegionError } from "../src/errors.js";
import { calculateTax, resolveTaxRate, supportedRegions } from "../src/tax.js";

describe("resolveTaxRate", () => {
  it("returns the rate in basis points", () => {
    expect(resolveTaxRate("US-CA")).toBe(725);
    expect(resolveTaxRate("IE")).toBe(2300);
  });

  it("normalizes region codes", () => {
    expect(resolveTaxRate(" us-tx ")).toBe(625);
  });

  it("returns zero for zero-rate regions", () => {
    expect(resolveTaxRate("US-OR")).toBe(0);
  });

  it("returns null for unknown regions", () => {
    expect(resolveTaxRate("ZZ")).toBeNull();
    expect(resolveTaxRate("")).toBeNull();
  });

  it("returns null for Object.prototype keys", () => {
    expect(resolveTaxRate("toString")).toBeNull();
  });
});

describe("calculateTax", () => {
  it("uses the region's rate", () => {
    expect(calculateTax(10_000, "US-CA")).toBe(725);
    expect(calculateTax(10_000, "DE")).toBe(1900);
  });

  it("normalizes region codes", () => {
    expect(calculateTax(10_000, " us-ny ")).toBe(400);
  });

  it("supports zero-rate regions", () => {
    expect(calculateTax(10_000, "US-OR")).toBe(0);
  });

  it("throws for unknown regions", () => {
    expect(() => calculateTax(10_000, "ZZ")).toThrow(UnknownRegionError);
  });

  it("does not treat Object.prototype keys as regions", () => {
    expect(() => calculateTax(10_000, "constructor")).toThrow(UnknownRegionError);
  });
});

describe("supportedRegions", () => {
  it("lists regions alphabetically", () => {
    const regions = supportedRegions();
    expect(regions).toContain("US-CA");
    expect(regions).toEqual([...regions].sort());
  });
});
