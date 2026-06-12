// Domain error carrying an HTTP status. Services throw these; the error handler
// middleware maps `statusCode` to the response, so controllers can just forward them.
// `details` (optional) is merged into the JSON body alongside `error` — used when an
// error response must carry extra fields (e.g. quiz timing on a 409).
export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
