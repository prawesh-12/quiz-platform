// Domain error carrying an HTTP status. Services throw these; the error handler maps
// `statusCode` to the response. `details` (optional) merges into the JSON body.
export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
