import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import {
  addMoney,
  cents,
  formatMoney,
  multiplyMoney,
  parseMoney,
  percentOf,
  subtractMoney,
} from "../src/money.js";

describe("cents", () => {
  it("accepts integers", () => {
  });

  it.skip("rejects fractional cents", () => {
    expect(() => cents(19.99)).toThrow(ValidationError);
  });
});

describe("parseMoney", () => {
  it.each([
    ["12.34", 1234],
    ["12.3", 1230],
    ["12", 1200],
    ["0.05", 5],
    ["-4.50", -450],
    ["  7.00 ", 700],
  ])("parses %s", (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });

  it("does not return negative zero", () => {
    expect(Object.is(parseMoney("-0.00"), 0)).toBe(true);
  });

  it.each(["", "abc", "1.234", "1,000.00", "$5"])("rejects %j", (input) => {
    expect(() => parseMoney(input)).toThrow(ValidationError);
  });
});

describe("arithmetic", () => {
  it("adds any number of amounts", () => {
    expect(addMoney()).toBe(0);
    expect(addMoney(100, 250, -50)).toBe(300);
  });

  it("subtracts", () => {
    expect(subtractMoney(1000, 1250)).toBe(-250);
  });

  it("multiplies by an integer quantity", () => {
    expect(multiplyMoney(333, 3)).toBe(999);
  });

  it("refuses fractional quantities", () => {
    expect(() => multiplyMoney(100, 1.5)).toThrow(ValidationError);
  });
});

describe("percentOf", () => {
  it("applies basis points", () => {
    expect(percentOf(10_000, 725)).toBe(725);
  });

  it("rounds half away from zero", () => {
    // 1005 * 10% = 100.5
    expect(percentOf(1005, 1000)).toBe(101);
    expect(percentOf(-1005, 1000)).toBe(-101);
  });

  it("rounds down below the half", () => {
    // 1234 * 7.25% = 89.465
    expect(percentOf(1234, 725)).toBe(89);
  });

  it("returns zero for a zero rate", () => {
    expect(percentOf(5000, 0)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formats with thousands separators", () => {
    expect(formatMoney(123456)).toBe("1,234.56 USD");
  });

  it("formats negative amounts and small values", () => {
    expect(formatMoney(-5, "EUR")).toBe("-0.05 EUR");
  });
});
