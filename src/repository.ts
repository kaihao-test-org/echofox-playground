import { NotFoundError } from "./errors.js";
import type { Invoice, InvoiceStatus } from "./invoice.js";
import {
  paginateByCursor,
  type CursorKey,
  type CursorPage,
  type CursorPageRequest,
} from "./pagination.js";

export interface ListInvoicesOptions extends CursorPageRequest {
  customerId?: string;
  status?: InvoiceStatus;
}

export interface InvoiceRepository {
  save(invoice: Invoice): void;
  findById(id: string): Invoice | undefined;
  getById(id: string): Invoice;
  list(options?: ListInvoicesOptions): CursorPage<Invoice>;
  delete(id: string): boolean;
}

export function invoiceCursorKey(invoice: Invoice): CursorKey {
  return { t: invoice.issuedAt.getTime(), id: invoice.id };
}

/** Newest first; invoices issued at the same instant are ordered by id. */
export function compareInvoiceKeys(a: CursorKey, b: CursorKey): number {
  if (a.t !== b.t) {
    return b.t - a.t;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export function compareInvoices(a: Invoice, b: Invoice): number {
  return compareInvoiceKeys(invoiceCursorKey(a), invoiceCursorKey(b));
}

/**
 * In-memory repository used by tests and the local dev server. Stores deep
 * copies so callers can't mutate stored invoices by accident.
 */
export class InMemoryInvoiceRepository implements InvoiceRepository {
  private readonly invoices = new Map<string, Invoice>();

  save(invoice: Invoice): void {
    this.invoices.set(invoice.id, structuredClone(invoice));
  }

  findById(id: string): Invoice | undefined {
    const invoice = this.invoices.get(id);
    return invoice && structuredClone(invoice);
  }

  getById(id: string): Invoice {
    const invoice = this.findById(id);
    if (!invoice) {
      throw new NotFoundError("Invoice", id);
    }
    return invoice;
  }

  list(options: ListInvoicesOptions = {}): CursorPage<Invoice> {
    const { customerId, status, ...pageRequest } = options;
    const matching = [...this.invoices.values()]
      .filter((invoice) => customerId === undefined || invoice.customerId === customerId)
      .filter((invoice) => status === undefined || invoice.status === status)
      .sort(compareInvoices)
      .map((invoice) => structuredClone(invoice));
    return paginateByCursor(matching, pageRequest, invoiceCursorKey, compareInvoiceKeys);
  }

  delete(id: string): boolean {
    return this.invoices.delete(id);
  }

  get size(): number {
    return this.invoices.size;
  }
}
