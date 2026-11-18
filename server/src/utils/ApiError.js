// A custom error that carries an HTTP status code.
// Controllers do `throw new ApiError(404, 'Product not found')` and the central
// error handler turns it into a clean JSON response.
export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
