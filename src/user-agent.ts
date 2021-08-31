// Code Generated. DO NOT EDIT!

import { isSSR } from "./ssr";

const scriptTag = !isSSR()
  ? (document.currentScript as HTMLScriptElement | null)?.src
  : null;
let suffix = "";
if (scriptTag) {
  const source = new URL(scriptTag).host;
  suffix = `(via ${source})`;
} else if (isSSR()) {
  suffix = "(SSR)";
}
/**
 * user agent of sdk
 * @hidden
 */
export const USER_AGENT = ["sajari-sdk-js/2.1.1", suffix]
  .filter(Boolean)
  .join(" ");
