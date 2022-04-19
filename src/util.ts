import { isSSR } from "./ssr";

/**
 * RequestError defines an error occuring from a request.
 */
export class RequestError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly error?: Error
  ) {
    super(message);

    // TODO(jingram): Remove this when compilation target is higher than ES5.
    Object.setPrototypeOf(this, RequestError.prototype);
  }
}

// Having a proxy helps enables SSR execution (docs)
export const setItem = (key: string, value: string) => {
  if (isSSR()) {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    console.error(`Search.io local storage "${key}" cannot be saved.`, value);
  }
};
export const getItem = (key: string): string | null => {
  if (isSSR()) {
    return "";
  }
  return localStorage.getItem(key);
};
