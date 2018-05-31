import {
  BaseSession,
  TextSession,
  TrackingType,
  Client,
  withEndpoint
} from "./index";

const mockXMLHttpRequest = () => {
  class XMLMock {
    readyState: number;
    status: number;
    responseText: string;
    send() {
      this.readyState = XMLHttpRequest.DONE;
      this.status = 200;
      this.responseText = JSON.stringify({
        searchResponse: {
          results: [],
          reads: "0",
          totalResults: "0",
          time: "0"
        },
        values: {}
      });
      this.onreadystatechange();
    }
    open() {}
    setRequestHeader() {}
    onreadystatechange() {}
  }

  (window as any).XMLHttpRequest = jest.fn(() => new XMLMock());
};

describe("Session", () => {
  test("Session", () => {
    const s = new BaseSession(TrackingType.TrackingNone, "", {});
    let [_, err] = s.next({});
    expect(err).toBeUndefined();
    [_, err] = s.next({});
    expect(err).toBeUndefined();
    s.reset();
  });

  test("TextSession", () => {
    const s = new TextSession(
      "q",
      new BaseSession(TrackingType.TrackingClick, "", {})
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

  test("search", done => {
    mockXMLHttpRequest();
    new Client("", "")
      .pipeline("")
      .search(
        {},
        new BaseSession(TrackingType.TrackingClick, "", {}),
        (err, res, vals) => {
          console.log(err, res, vals);
          done();
        }
      );
  });
});
