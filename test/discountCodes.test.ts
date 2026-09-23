import { beforeEach, describe, expect, it } from "vitest";
import {
  DiscountCodeRegistry,
  InvalidDiscountCodeError,
  type DiscountCode,
} from "../src/discountCodes.js";
import { ValidationError } from "../src/errors.js";

const now = new Date("2024-06-01T12:00:00Z");

describe("DiscountCodeRegistry", () => {
  let registry: DiscountCodeRegistry;

  beforeEach(() => {
    registry = new DiscountCodeRegistry();
  });

  function register(overrides: Partial<DiscountCode> = {}) {
    registry.register({ code: "SPRING15", percentOff: 15, ...overrides });
  }

  describe("redeem", () => {
    it("returns a fixed discount for the percentage", () => {
      register();
      expect(registry.redeem("SPRING15", 20_000, now)).toEqual({
        kind: "fixed",
        amount: 3000,
        label: "Code SPRING15 (15% off)",
      });
    });

    it("supports fractional percentages", () => {
      register({ code: "HALFTEN", percentOff: 12.5 });
      expect(registry.redeem("HALFTEN", 8000, now)).toMatchObject({ amount: 1000 });
    });

    it("matches codes case-insensitively", () => {
      register();
      expect(registry.redeem("  spring15 ", 10_000, now)).toMatchObject({ amount: 1500 });
    });

    it("rejects unknown codes", () => {
      expect(() => registry.redeem("NOPE", 10_000, now)).toThrow(InvalidDiscountCodeError);
    });

    it("rejects expired codes", () => {
      register({ expiresAt: new Date("2024-05-31T23:59:59Z") });
      expect(() => registry.redeem("SPRING15", 10_000, now)).toThrow(/expired/);
    });

    it("rejects codes once fully redeemed", () => {
      register({ maxRedemptions: 2 });
      registry.redeem("SPRING15", 10_000, now);
      registry.redeem("SPRING15", 10_000, now);
      expect(() => registry.redeem("SPRING15", 10_000, now)).toThrow(/exhausted/);
      expect(registry.redemptionCount("spring15")).toBe(2);
    });

    it("enforces the minimum subtotal", () => {
      register({ minimumSubtotal: 5000 });
      expect(() => registry.redeem("SPRING15", 4999, now)).toThrow(/below_minimum/);
      expect(registry.redemptionCount("SPRING15")).toBe(0);
    });
  });

  describe("register", () => {
    it.each([
      { code: "X", percentOff: 10 },
      { code: "SPRING 15", percentOff: 10 },
      { code: "ZERO", percentOff: 0 },
      { code: "TOOMUCH", percentOff: 101 },
      { code: "BADMAX", percentOff: 10, maxRedemptions: 0 },
      { code: "BADMIN", percentOff: 10, minimumSubtotal: 49.99 },
    ])("rejects %j", (code) => {
      expect(() => registry.register(code)).toThrow(ValidationError);
    });

    it("rejects duplicates regardless of case", () => {
      register();
      expect(() => registry.register({ code: "spring15", percentOff: 20 })).toThrow(
        ValidationError,
      );
    });
  });
});
