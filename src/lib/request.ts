/**
 * HTTP_STATUS_OK defines a constant for the http OK status.
 * @hidden
 */
const HTTP_STATUS_OK: number = 200;

/**
 * HTTP_STATUS_UNAUTHORIZED defines a constant for the http UNAUTHORIZED status.
 * @hidden
 */
const HTTP_STATUS_UNAUTHORIZED: number = 403;

export enum TransportError {
  None,
  Connection,
  ParseResponse
}

/**
 * RequestError defines an error occuring from a request.
 * It can include the http status code returned from the server.
 */
export interface RequestError extends Error {
  /** httpStatusCode is the returned HTTP status code. */
  httpStatusCode?: number;
  /** transportErrorCode is the internal error type. */
  transportErrorCode?: TransportError;
  /** error holds the underlaying error */
  error?: Error;
}

export type RequestCallback = (
  error: RequestError | null,
  response?: any
) => void;

/**
 * request makes a XMLHttpRequest and handles network and parsing errors.
 * @hidden
 */
export const request = (
  address: string,
  body: any,
  callback: RequestCallback
): void => {
  const req = new XMLHttpRequest();
  req.open("POST", address, true);
  req.setRequestHeader("Accept", "application/json");
  req.setRequestHeader("Content-Type", "text/plain");
  req.onreadystatechange = () => {
    if (req.readyState !== XMLHttpRequest.DONE) {
      return;
    }

    if (req.status === 0) {
      const error = new Error(
        "Search request failed due to a network error. Please check your network connection."
      ) as RequestError;
      error.transportErrorCode = TransportError.Connection;

      callback(error);
      return;
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(req.responseText);
    } catch (e) {
      const error = new Error("Failed to parse response") as RequestError;
      error.httpStatusCode = req.status;
      error.transportErrorCode = TransportError.ParseResponse;

      callback(error);
      return;
    }

    if (req.status === HTTP_STATUS_UNAUTHORIZED) {
      const error = new Error(
        "This domain is not authorized to make this search request."
      ) as RequestError;
      error.httpStatusCode = req.status;
      error.error = new Error(parsedResponse.message);

      callback(error);
      return;
    }

    if (req.status !== HTTP_STATUS_OK) {
      const error = new Error(
        "Search request failed due to a configuration error."
      ) as RequestError;
      error.httpStatusCode = req.status;
      error.error = new Error(parsedResponse.message);

      callback(error);
      return;
    }

    callback(null, parsedResponse);
  };

  req.send(body);
};
