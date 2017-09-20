import { userAgent, Client } from "./sajari";

test("package version in code matches package", () => {
  const packageVersion = require("../package.json").version;
  expect(userAgent).toBe("sdk-js-" + packageVersion);
});

test("setting and getting custom metadata", () => {
  const client = new Client("", "");
  const key = "foo";
  const value = ["bar"];
  client.setCustomMetadata({ [key]: value });
  expect(client.getMetadata()).toHaveProperty(key, value);
});
