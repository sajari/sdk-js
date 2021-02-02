const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");

const template = `// Code Generated. DO NOT EDIT!

import { isSSR } from "./ssr";

const scriptTag = !isSSR()
  ? (document.currentScript as HTMLScriptElement | null)?.src
  : null;
let suffix = "";

if (scriptTag) {
  const source = new URL(scriptTag).host;
  suffix = \`(via \${source})\`;
} else if (isSSR()) {
  suffix = "(SSR)";
}

/**
 * User agent of SDK
 * @hidden
 */
export const USER_AGENT = ["sajari-sdk-js/${pkg.version}", suffix]
  .filter(Boolean)
  .join(" ");
`;

fs.writeFileSync(path.join(__dirname, "../src/user-agent.ts"), template);
