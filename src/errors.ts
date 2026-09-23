/**
 * Base class for every error this library throws on purpose. Callers can
 * `instanceof InvoicingError` to tell our errors apart from programming bugs.
 */
export class InvoicingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Input failed validation (bad amount, empty SKU, malformed cursor, ...). */
export class ValidationError extends InvoicingError {}

/** No tax rate is configured for the requested region. */
export class UnknownRegionError extends InvoicingError {
  constructor(readonly region: string) {
    super(`No tax rate configured for region "${region}"`);
  }
}

/** A lookup by id did not match anything. */
export class NotFoundError extends InvoicingError {
  constructor(
    readonly entity: string,
    readonly id: string,
  ) {
    super(`${entity} "${id}" not found`);
  }
}
