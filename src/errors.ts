/**
 * APIError defines an error occuring from the API.
 */
export class APIError extends Error {
  readonly code: number;
  readonly details?: { type_url: string; value: any }[];

  constructor(
    message: string,
    code: number,
    details?: { type_url: string; value: any }[]
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

/**
 * NetworkError defines an error occuring from the network.
 */
export class NetworkError extends Error {
  type: "CONNECTION";

  constructor(message: string) {
    super(message);
    this.type = "CONNECTION";
  }
}

/**
 * RequestError defines an error occuring from a request.
 */
export class RequestError extends Error {
  public readonly statusCode: number;
  public readonly error?: Error;

  constructor(statusCode: number, message: string, error?: Error) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;

    // TODO(jingram): Remove this when compilation target is higher than ES5.
    Object.setPrototypeOf(this, RequestError.prototype);
  }
}
