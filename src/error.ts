export interface RequestError extends Error {
  code?: number;
}

export const newRequestError = (
  message: string,
  code?: number
): RequestError => {
  const error = new Error(message) as RequestError;
  if (code !== undefined) {
    error.code = code;
  }
  return error;
};
