import { USER_AGENT } from "../src/user-agent";
import pkg from "../package.json";

describe("user-agent", () => {
  test("Should return the UA string correctly", () => {
    expect(USER_AGENT).toBe(`sajari-sdk-js/${pkg.version}`);
  });
});
