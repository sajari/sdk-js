import { isSSR } from "./ssr";

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
