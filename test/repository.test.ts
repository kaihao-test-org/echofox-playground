import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError } from "../src/errors.js";
import { InMemoryInvoiceRepository } from "../src/repository.js";
import { invoice } from "./fixtures.js";

describe("InMemoryInvoiceRepository", () => {
  let repo: InMemoryInvoiceRepository;

  beforeEach(() => {
    repo = new InMemoryInvoiceRepository();
  });

  it("saves and loads a copy", () => {
    const original = invoice({ id: "inv_1" });
    repo.save(original);
    const loaded = repo.getById("inv_1");
    expect(loaded).toEqual(original);
    expect(loaded).not.toBe(original);
  });

  it("isolates stored invoices from caller mutation", () => {
    const original = invoice({ id: "inv_1" });
    repo.save(original);
    original.lineItems[0]!.quantity = 99;
    expect(repo.getById("inv_1").lineItems[0]!.quantity).toBe(1);
  });

  it("throws NotFoundError for unknown ids", () => {
    expect(repo.findById("nope")).toBeUndefined();
    expect(() => repo.getById("nope")).toThrow(NotFoundError);
  });

  it("deletes", () => {
    repo.save(invoice({ id: "inv_1" }));
    expect(repo.delete("inv_1")).toBe(true);
    expect(repo.delete("inv_1")).toBe(false);
    expect(repo.size).toBe(0);
  });

  describe("list", () => {
    beforeEach(() => {
      repo.save(invoice({ id: "inv_a", issuedAt: new Date("2024-01-01"), status: "paid" }));
      repo.save(invoice({ id: "inv_b", issuedAt: new Date("2024-02-01"), customerId: "cus_other" }));
      repo.save(invoice({ id: "inv_c", issuedAt: new Date("2024-03-01") }));
      repo.save(invoice({ id: "inv_d", issuedAt: new Date("2024-03-01") }));
    });

    it("lists newest first, breaking ties by id", () => {
      expect(repo.list().items.map((i) => i.id)).toEqual(["inv_c", "inv_d", "inv_b", "inv_a"]);
    });

    it("filters by customer and status", () => {
      expect(repo.list({ customerId: "cus_other" }).items.map((i) => i.id)).toEqual(["inv_b"]);
      expect(repo.list({ status: "paid" }).items.map((i) => i.id)).toEqual(["inv_a"]);
    });

    it("paginates", () => {
      const page = repo.list({ page: 2, pageSize: 3 });
      expect(page.items.map((i) => i.id)).toEqual(["inv_a"]);
      expect(page.totalItems).toBe(4);
      expect(page.totalPages).toBe(2);
    });
  });
});
