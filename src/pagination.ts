import { ValidationError } from "./errors.js";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PageRequest {
  /** 1-based page number. Defaults to 1. */
  page?: number;
  /** Defaults to DEFAULT_PAGE_SIZE, capped at MAX_PAGE_SIZE. */
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function validatePageSize(pageSize: number): void {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new ValidationError(
      `pageSize must be an integer between 1 and ${MAX_PAGE_SIZE}, got ${pageSize}`,
    );
  }
}

/** Offset pagination over an already-sorted list. */
export function paginate<T>(items: readonly T[], request: PageRequest = {}): Page<T> {
  const page = request.page ?? 1;
  const pageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError(`page must be a positive integer, got ${page}`);
  }
  validatePageSize(pageSize);

  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

/**
 * Position of an item in a sorted listing. `t` is a millisecond timestamp and
 * `id` breaks ties, so the key is unique and stable across inserts.
 */
export interface CursorKey {
  t: number;
  id: string;
}

export interface CursorPageRequest {
  /** Maximum number of items to return. Defaults to DEFAULT_PAGE_SIZE. */
  limit?: number;
  /** Opaque cursor from a previous page's `nextCursor`. */
  cursor?: string | null;
}

export interface CursorPage<T> {
  items: T[];
  /** Pass back as `cursor` to fetch the next page; `null` on the last page. */
  nextCursor: string | null;
}

export function encodeCursor(key: CursorKey): string {
  return Buffer.from(JSON.stringify(key), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): CursorKey {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new ValidationError("Malformed pagination cursor");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as CursorKey).t !== "number" ||
    typeof (parsed as CursorKey).id !== "string"
  ) {
    throw new ValidationError("Malformed pagination cursor");
  }
  return { t: (parsed as CursorKey).t, id: (parsed as CursorKey).id };
}

/**
 * Keyset pagination over a list that is already sorted by `compare`.
 *
 * Unlike offset pagination, pages stay consistent when items are inserted or
 * deleted between requests: the cursor remembers *where* we were, not *how
 * many* items we had seen.
 */
export function paginateByCursor<T>(
  sorted: readonly T[],
  request: CursorPageRequest,
  keyOf: (item: T) => CursorKey,
  compare: (a: CursorKey, b: CursorKey) => number,
): CursorPage<T> {
  const limit = request.limit ?? DEFAULT_PAGE_SIZE;
  const after = request.cursor ? decodeCursor(request.cursor) : null;

  const remaining =
    after === null ? sorted : sorted.filter((item) => compare(keyOf(item), after) > 0);

  // Read one extra item so we know whether there is another page without a
  // separate count query.
  const batch = remaining.slice(0, limit + 1);
  const hasMore = batch.length > limit;
  const items = batch.slice(0, limit);

  return {
    items,
    nextCursor: hasMore ? encodeCursor(keyOf(batch[limit])) : null,
  };
}
