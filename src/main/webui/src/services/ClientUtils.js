export class ClientRequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
