const HTTP_STATUS_OK: number = 200;

export interface RequestError extends Error {
  code?: number;
}

export const newRequestError = (
  message: string,
  code?: number
): RequestError => {
  const error = new Error(message) as RequestError;
  error.name = "RequestError";
  if (code !== undefined) {
    error.code = code;
  }
  return error;
};

export type RequestCallback = (
  error: RequestError | null,
  response?: any
) => void;

// request makes a XMLHttpRequest and handles network and parsing errors.
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
      callback(newRequestError("connection error", 0));
      return;
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(req.responseText);
    } catch (e) {
      callback(newRequestError("error parsing response"));
      return;
    }

    if (req.status === HTTP_STATUS_OK) {
      callback(null, parsedResponse);
      return;
    }

    callback(newRequestError(parsedResponse.message, req.status));
  };

  req.send(body);
};
