import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import { MAX_PAGE_SIZE, paginate } from "../src/pagination.js";

const letters = ["a", "b", "c", "d", "e"];

describe("paginate", () => {
  it("returns the requested page", () => {
    expect(paginate(letters, { page: 2, pageSize: 2 })).toEqual({
      items: ["c", "d"],
      page: 2,
      pageSize: 2,
      totalItems: 5,
      totalPages: 3,
    });
  });

  it("returns a short last page", () => {
    expect(paginate(letters, { page: 3, pageSize: 2 }).items).toEqual(["e"]);
  });

  it("returns an empty page past the end", () => {
    expect(paginate(letters, { page: 4, pageSize: 2 }).items).toEqual([]);
  });

  it("defaults to the first page", () => {
    expect(paginate(letters).items).toEqual(letters);
  });

  it.each([0, -1, 1.5])("rejects page %s", (page) => {
    expect(() => paginate(letters, { page })).toThrow(ValidationError);
  });

  it.each([0, MAX_PAGE_SIZE + 1, 2.5])("rejects pageSize %s", (pageSize) => {
    expect(() => paginate(letters, { pageSize })).toThrow(ValidationError);
  });
});
