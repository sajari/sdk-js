import { newRequestError } from "./error";

describe("Error", () => {
  test("Error", () => {
    const contents = "foo";
    const e = newRequestError(contents);
    expect(e.message).toEqual(contents);
  });

  test("Error with code", () => {
    const contents = "foo";
    const code = 500;
    const e = newRequestError(contents, code);
    expect(e.message).toEqual(contents);
    expect(e.code).toEqual(code);
  });
});
