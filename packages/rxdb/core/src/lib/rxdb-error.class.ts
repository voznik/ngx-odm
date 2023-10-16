export class NgxRxdbError extends Error {
  /** @internal */
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, NgxRxdbError.prototype);
  }
}
