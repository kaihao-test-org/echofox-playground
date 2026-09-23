import { describe, expect, it } from "vitest";
import { UnknownRegionError } from "../src/errors.js";
import { calculateTax, supportedRegions } from "../src/tax.js";

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
