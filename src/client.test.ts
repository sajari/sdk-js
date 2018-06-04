import { Client, withEndpoint } from "./client";
import { BaseSession, TrackingType } from "./session";
import { mockXMLHttpRequest } from "./__mocks__/XMLHttpRequest";

describe("Client", () => {
  test("Client", () => {
    expect(() => new Client("", "")).not.toThrow();
  });

  test("withEndpoint", () => {
    expect(() => new Client("", "", [withEndpoint("")])).not.toThrow();
  });

  test("pipeline", () => {
    expect(() => new Client("", "").pipeline("")).not.toThrow();
  });
});

describe("Pipeline", () => {
  test("Pipeline", () => {
    expect(() => new Client("", "").pipeline("")).not.toThrow();
  });

  test("search", done => {
    mockXMLHttpRequest();
    new Client("", "")
      .pipeline("")
      .search(
        {},
        new BaseSession(TrackingType.Click, "", {}),
        (err, res, vals) => {
          console.log(err, res, vals);
          done();
        }
      );
  });
});
