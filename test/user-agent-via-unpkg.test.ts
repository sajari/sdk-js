import pkg from "../package.json";

beforeAll(() => {
  const script = document.createElement("script");
  script.src = "https://unpkg.com/@sajari/sdk-js@2.0.0-alpha.18/dist/index.js";

  Object.defineProperty(document, "currentScript", {
    value: script,
  });
});

it("Should return the UA string that includes '(via unpkg.com)'", () => {
  // Had to do this because otherwise importing it on the top of file will run the code before the `beforeAll` handler
  const { USER_AGENT } = require("../src/user-agent");
  expect(USER_AGENT).toBe(`sajari-sdk-js/${pkg.version} (via unpkg.com)`);
});
