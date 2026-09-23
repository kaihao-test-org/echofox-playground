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
