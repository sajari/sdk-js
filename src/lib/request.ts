/**
 * HTTP_STATUS_OK defines a constant for the http OK status.
 * @hidden
 */
const HTTP_STATUS_OK: number = 200;

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
  req.setRequestHeader("Content-Type", "application/json");
  req.onreadystatechange = () => {
    if (req.readyState !== XMLHttpRequest.DONE) {
      return;
    }

    if (req.status === 0) {
      const error = new Error("connection error") as RequestError;
      error.transportErrorCode = TransportError.Connection;

      callback(error);
      return;
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(req.responseText);
    } catch (e) {
      const error = new Error("error parsing response") as RequestError;
      error.httpStatusCode = req.status;
      error.transportErrorCode = TransportError.ParseResponse;

      callback(error);
      return;
    }

    if (req.status !== HTTP_STATUS_OK) {
      const error = new Error(parsedResponse.message) as RequestError;
      error.httpStatusCode = req.status;

      callback(error);
      return;
    }

    callback(null, parsedResponse);
  };

  req.send(body);
};
