import { Client, withEndpoint } from "./client";
import { DefaultSession, TrackingType } from "./session";
import { XMLHttpRequestMock } from "./__mocks__/XMLHttpRequest";

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
    XMLHttpRequestMock({
      status: 200,
      responseText: {
        searchResponse: {
          results: [],
          reads: "0",
          totalResults: "0",
          time: "0"
        },
        values: {}
      }
    });

    new Client("", "")
      .pipeline("")
      .search(
        {},
        new DefaultSession(TrackingType.Click, "", {}),
        (err, res, vals) => {
          expect(err).toBeNull();
          expect(res).toBeDefined();
          expect(vals).toBeDefined();

          expect(res.totalResults).toBe(0);
          expect(res.reads).toBe(0);
          done();
        }
      );
  });

  test("error state", done => {
    XMLHttpRequestMock({
      status: 500,
      responseText: {
        code: 500,
        message: "ERROR!!!"
      }
    });

    new Client("", "")
      .pipeline("")
      .search(
        {},
        new DefaultSession(TrackingType.Click, "", {}),
        (err, res, vals) => {
          expect(err).not.toBeNull();
          expect(res).toBeUndefined();
          expect(vals).toBeUndefined();

          expect(err.httpStatusCode).toBe(500);
          expect(err.transportErrorCode).toBeUndefined();

          done();
        }
      );
  });
});
