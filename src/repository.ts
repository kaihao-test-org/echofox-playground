import { NotFoundError } from "./errors.js";
import type { Invoice, InvoiceStatus } from "./invoice.js";
import { paginate, type Page, type PageRequest } from "./pagination.js";

export interface ListInvoicesOptions extends PageRequest {
  customerId?: string;
  status?: InvoiceStatus;
}

export interface InvoiceRepository {
  save(invoice: Invoice): void;
  findById(id: string): Invoice | undefined;
  getById(id: string): Invoice;
  list(options?: ListInvoicesOptions): Page<Invoice>;
  delete(id: string): boolean;
}

/** Newest first; invoices issued at the same instant are ordered by id. */
export function compareInvoices(a: Invoice, b: Invoice): number {
  const byDate = b.issuedAt.getTime() - a.issuedAt.getTime();
  if (byDate !== 0) {
    return byDate;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
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

  list(options: ListInvoicesOptions = {}): Page<Invoice> {
    const { customerId, status, ...pageRequest } = options;
    const matching = [...this.invoices.values()]
      .filter((invoice) => customerId === undefined || invoice.customerId === customerId)
      .filter((invoice) => status === undefined || invoice.status === status)
      .sort(compareInvoices)
      .map((invoice) => structuredClone(invoice));
    return paginate(matching, pageRequest);
  }

  delete(id: string): boolean {
    return this.invoices.delete(id);
  }

  get size(): number {
    return this.invoices.size;
  }
}
