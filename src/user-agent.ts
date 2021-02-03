// Code Generated. DO NOT EDIT!

import { isSSR } from "./ssr";

/**
 * Parse a host from a URL
 * @hidden
 */
const getHost = (url: string) => {
  const a = document.createElement("a");
  a.href = url;
  return a.host;
};

/**
 * The source of the script
 * @hidden
 */
let scriptSrc = null;

/**
 * The suffix to add to the user agent
 * @hidden
 */
let suffix = "";

if (!isSSR()) {
  const scriptElement = document.currentScript as HTMLScriptElement | null;

  if (scriptElement) {
    scriptSrc = scriptElement.src;
  }
}

if (scriptSrc) {
  const source = getHost(scriptSrc);
  suffix = `(via ${source})`;
} else if (isSSR()) {
  suffix = "(SSR)";
}

/**
 * User agent of SDK
 * @hidden
 */
export const USER_AGENT = ["sajari-sdk-js/1.0.11", suffix]
  .filter(Boolean)
  .join(" ");
