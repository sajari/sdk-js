import {
  Session,
  TextSession,
  TrackingType,
  Client,
  withEndpoint
} from "./index";
import { createServer } from "http";

const srv = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end("1");
});

describe("Session", () => {
  test("Session", () => {
    const s = new Session(TrackingType.TrackingNone, "", {});
    let [_, err] = s.next({});
    expect(err).toBeUndefined();
    [_, err] = s.next({});
    expect(err).toBeUndefined();
    s.reset();
  });

  test("TextSession", () => {
    const s = new TextSession(
      "q",
      new Session(TrackingType.TrackingClick, "", {})
    );
    let [_, err] = s.next({ q: "foo" });
    expect(err).toBeUndefined();
    [_, err] = s.next({ q: "" });
    expect(err).toBeUndefined();
    s.reset();
  });
});

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
});
