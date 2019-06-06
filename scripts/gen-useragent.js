const fs = require("fs");
const path = require("path");
const pkg = require("../package.json");

const template = `// Code Generated. DO NOT EDIT!

/**
 * user agent of sdk
 * @hidden
 */
export const USER_AGENT = "sdk-js-${pkg.version}";
`;

fs.writeFileSync(path.join(__dirname, "../src/user-agent.ts"), template);
