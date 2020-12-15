/**
 * @jest-environment node
 */

import { USER_AGENT } from "../src/user-agent";
import pkg from "../package.json";

describe("user-agent in SSR", () => {
  test("Should return the UA string correctly in SSR", () => {
    expect(USER_AGENT).toBe(`sajari-sdk-js/${pkg.version} (SSR)`);
  });
});
