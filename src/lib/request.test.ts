import { request, newRequestError } from "./request";
import { mockXMLHttpRequest } from "../__mocks__/XMLHttpRequest";

describe("RequestError", () => {
  test("RequestError", () => {
    const contents = "foo";
    const e = newRequestError(contents);
    expect(e.message).toEqual(contents);
  });

  test("RequestError with code", () => {
    const contents = "foo";
    const code = 500;
    const e = newRequestError(contents, code);
    expect(e.message).toEqual(contents);
    expect(e.code).toEqual(code);
  });
});

describe("request", () => {
  test("basic", done => {
    mockXMLHttpRequest();
    request("http://example.com", { hello: "world" }, (error, response) => {
      expect(error).toBeNull();
      done();
    });
  });
});
