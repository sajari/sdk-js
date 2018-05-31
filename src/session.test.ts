import { BaseSession, TextSession, TrackingType } from "./session";

describe("Session", () => {
  describe("BaseSession", () => {
    test("BaseSession", () => {
      const s = new BaseSession(TrackingType.None, "", {});
      let [_, err] = s.next({});
      expect(err).toBeUndefined();
      [_, err] = s.next({});
      expect(err).toBeUndefined();
      s.reset();
    });
  });

  describe("TextSession", () => {
    test.each([
      ["foo", undefined, true],
      ["foo", "woo", true],
      ["foo", "", true],
      ["foof", "foow", false],
      ["", "foo", false],
      ["foo", "fo", false]
    ])(
      `TextSession changing query value from %o to %o resets: %o`,
      (from, to, reset) => {
        const s = new TextSession(
          "q",
          new BaseSession(TrackingType.Click, "", {})
        );
        let [values, err] = s.next({ q: from });
        expect(err).toBeUndefined();
        let qid = values.query_id;

        [values, err] = s.next({ q: to });
        expect(err).toBeUndefined();

        if (reset) {
          expect(values.query_id).not.toBe(qid);
        } else {
          expect(values.query_id).toBe(qid);
        }
      }
    );
  });
});
