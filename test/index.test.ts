import {
  Client,
  RequestError,
  DefaultSession,
  TrackingType,
} from "../src/index";

const client = new Client("test", "test", "test.com");

describe("Client", () => {
  beforeEach(() => {
    global.fetch.resetMocks();
  });

  it("call", () => {
    global.fetch.mockResponseOnce(JSON.stringify({ data: "12345" }));

    expect.assertions(1);
    return client.call("/hello", { foo: "bar" }).then((res) => {
      expect(res.data).toEqual("12345");
    });
  });

  it("call error", () => {
    global.fetch.mockRejectOnce(new RequestError(500, "oh noes"));

    expect.assertions(2);
    return client.call("/hello", { foo: "bar" }).catch((err) => {
      expect(err.statusCode).toEqual(500);
      expect(err.message).toEqual("oh noes");
    });
  });
});

describe("Pipeline", () => {
  beforeEach(() => {
    global.fetch.resetMocks();
  });

  it("search", async () => {
    global.fetch.mockResponseOnce(
      JSON.stringify({ searchResponse: { time: "0.003s", totalResults: 0 } })
    );

    const session = new DefaultSession(TrackingType.None, "url");
    const [response, values] = await client
      .pipeline("test", "test")
      .search({ q: "hello" }, session.next());

    expect(values).toEqual({});
    expect(response).toStrictEqual({
      time: 0.003,
      totalResults: 0,
      results: [],
      aggregates: {},
      aggregateFilters: {},
    });

    expect(global.fetch.mock.calls.length).toEqual(1);
    expect(global.fetch.mock.calls[0][0]).toEqual(
      "test.com/sajari.api.pipeline.v1.Query/Search"
    );
  });
});
