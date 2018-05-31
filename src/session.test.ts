import { BaseSession, TextSession, TrackingType } from "./session";

describe("Session", () => {
  test("Session", () => {
    const s = new BaseSession(TrackingType.None, "", {});
    let [_, err] = s.next({});
    expect(err).toBeUndefined();
    [_, err] = s.next({});
    expect(err).toBeUndefined();
    s.reset();
  });

  test("TextSession", () => {
    const s = new TextSession("q", new BaseSession(TrackingType.Click, "", {}));
    let [values, err] = s.next({ q: "foo" });
    console.log({ type: values.type, trackingType: TrackingType.Click });
    expect(values.type).toBe(TrackingType.Click);
    let qid = values.query_id;
    expect(err).toBeUndefined();
    [values, err] = s.next({ q: "" });
    expect(values.query_id).not.toBe(qid);
    qid = values.query_id;
    expect(err).toBeUndefined();
    s.reset();
  });
});
