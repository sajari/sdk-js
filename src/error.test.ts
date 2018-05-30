import { newError } from "./error";

describe("Error", () => {
  test("Error", () => {
    const contents = "foo";
    const e = newError(contents);
    expect(e.message).toEqual(contents);
  });

  test("Error with code", () => {
    const contents = "foo";
    const code = 500;
    const e = newError(contents, code);
    expect(e.message).toEqual(contents);
    expect(e.code).toEqual(code);
  });
});
