import { userAgent } from "./sajari";

test("package version in code matches package", () => {
  const packageVersion = require("../package.json").version;
  expect(userAgent).toBe("sdk-js-" + packageVersion);
});
