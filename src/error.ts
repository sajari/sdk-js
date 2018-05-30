export interface SearchError extends Error {
  message: string;
  code?: number;
}

export const makeError = (message: string, code?: number): SearchError => {
  const error = new Error(message) as SearchError;
  if (code !== undefined) {
    error.code = code;
  }
  return error;
};
