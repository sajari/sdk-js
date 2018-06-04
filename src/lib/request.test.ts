import { request } from "./request";
import { XMLHttpRequestMock } from "../__mocks__/XMLHttpRequest";

describe("request", () => {
  test("basic", done => {
    XMLHttpRequestMock();
    request("http://example.com", { hello: "world" }, (error, response) => {
      expect(error).toBeNull();
      done();
    });
  });
});
