import { describe, expect, it } from "vitest";
import { ValidationError } from "../src/errors.js";
import {
  decodeCursor,
  encodeCursor,
  MAX_PAGE_SIZE,
  paginate,
  paginateByCursor,
  type CursorKey,
  type CursorPage,
} from "../src/pagination.js";

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

describe("cursor encoding", () => {
  it("round-trips a key", () => {
    const key = { t: Date.UTC(2024, 2, 1), id: "inv_0042" };
    expect(decodeCursor(encodeCursor(key))).toEqual(key);
  });

  it("produces URL-safe cursors", () => {
    expect(encodeCursor({ t: 1, id: "a/b+c?" })).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each(["", "not-a-cursor", encodeCursor({ t: 1, id: "x" }).slice(0, 5)])(
    "rejects malformed cursor %j",
    (cursor) => {
      expect(() => decodeCursor(cursor)).toThrow(ValidationError);
    },
  );

  it("rejects a cursor with the wrong shape", () => {
    const cursor = Buffer.from(JSON.stringify({ t: "yesterday" })).toString("base64url");
    expect(() => decodeCursor(cursor)).toThrow(ValidationError);
  });
});

describe("paginateByCursor", () => {
  type Row = CursorKey;
  const keyOf = (row: Row): CursorKey => row;
  const ascending = (a: CursorKey, b: CursorKey) => a.t - b.t || a.id.localeCompare(b.id);
  const rows: Row[] = [1, 2, 3, 4, 5].map((t) => ({ t, id: `row_${t}` }));

  it("returns the first page and a cursor when there are more rows", () => {
    const page = paginateByCursor(rows, { limit: 2 }, keyOf, ascending);
    expect(page.items.map((r) => r.id)).toEqual(["row_1", "row_2"]);
    expect(page.nextCursor).not.toBeNull();
  });

  it("returns no cursor when everything fits on one page", () => {
    const page = paginateByCursor(rows, { limit: 10 }, keyOf, ascending);
    expect(page.items).toHaveLength(5);
    expect(page.nextCursor).toBeNull();
  });

  it("does not repeat rows across pages", () => {
    const first = paginateByCursor(rows, { limit: 2 }, keyOf, ascending);
    const second = paginateByCursor(rows, { limit: 2, cursor: first.nextCursor }, keyOf, ascending);
    const firstIds = new Set(first.items.map((r) => r.id));
    expect(second.items.some((r) => firstIds.has(r.id))).toBe(false);
  });

  it("walks to the end and stops", () => {
    let cursor: string | null = null;
    let pages = 0;
    do {
      const page: CursorPage<Row> = paginateByCursor(rows, { limit: 2, cursor }, keyOf, ascending);
      expect(page.items.length).toBeLessThanOrEqual(2);
      cursor = page.nextCursor;
      pages += 1;
    } while (cursor !== null && pages < 10);
    expect(cursor).toBeNull();
  });

  it("is stable when rows are inserted before the cursor", () => {
    const first = paginateByCursor(rows, { limit: 2 }, keyOf, ascending);
    const withInsert = [{ t: 0, id: "row_0" }, ...rows];
    const second = paginateByCursor(withInsert, { limit: 2, cursor: first.nextCursor }, keyOf, ascending);
    expect(second.items.map((r) => r.id)).not.toContain("row_0");
  });
});
