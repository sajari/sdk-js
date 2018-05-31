import { Client, withEndpoint } from "./client";
import { BaseSession, TrackingType } from "./session";
import { mockXMLHttpRequest } from "./__mocks__/XMLHttpRequest";

describe("Client", () => {
  test("Client", () => {
    new Client("", "");
  });

  test("withEndpoint", () => {
    new Client("", "", [withEndpoint("")]);
  });

  test("pipeline", () => {
    const c = new Client("", "");
    c.pipeline("");
  });
});

describe("Pipeline", () => {
  test("Pipeline", () => {
    new Client("", "").pipeline("");
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
