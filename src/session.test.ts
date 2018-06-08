import { DefaultSession, InteractiveSession, TrackingType } from "./session";

describe("Session", () => {
  describe("BaseSession", () => {
    test("BaseSession", () => {
      const s = new DefaultSession(TrackingType.None, "", {});
      let [_, err] = s.next({});
      expect(err).toBeNull();
      [_, err] = s.next({});
      expect(err).toBeNull();
      s.reset();
    });
  });

  describe("TextSession", () => {
    // @ts-ignore: .each is a valid member of test
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
        const s = new InteractiveSession(
          "q",
          new DefaultSession(TrackingType.Click, "", {})
        );
        let [values, err] = s.next({ q: from });
        expect(err).toBeNull();
        let qid = values.query_id;

        [values, err] = s.next({ q: to });
        expect(err).toBeNull();

        if (reset) {
          expect(values.query_id).not.toBe(qid);
        } else {
          expect(values.query_id).toBe(qid);
        }
      }
    );
  });
});
