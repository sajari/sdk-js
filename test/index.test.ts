import {
  Client,
  RequestError,
  DefaultSession,
  TrackingType,
  SearchResponseProto,
} from "../src/index";

const client = new Client("test", "test", "test.com");

describe("Client", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("call", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ data: "12345" }));

    expect.assertions(1);
    return client.call("/hello", { foo: "bar" }).then((res) => {
      expect(res.data).toEqual("12345");
    });
  });

  it("call error", () => {
    fetchMock.mockRejectOnce(new RequestError(500, "oh noes"));

    expect.assertions(2);
    return client.call("/hello", { foo: "bar" }).catch((err) => {
      expect(err.statusCode).toEqual(500);
      expect(err.message).toEqual("oh noes");
    });
  });

  it("call with keys error", () => {
    const create = () => {
      new Client("test", "test", "test.com", "key", "secret");
    };

    expect(create).toThrow(Error);
  });
});

describe("Pipeline", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("search", async () => {
    fetchMock.mockResponseOnce(
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
      redirects: undefined,
    });

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      "test.com/sajari.api.pipeline.v1.Query/Search"
    );
  });

  it("search with redirects", async () => {
    const responseObj: SearchResponseProto = {
      searchResponse: {
        time: "0.003s",
        totalResults: "0",
      },
      redirects: {
        "hello world": {
          id: "1",
          target: "https://www.google.com",
          token: "https://re.sajari.com/12345abcd",
        },
      },
    };
    fetchMock.mockResponseOnce(JSON.stringify(responseObj));

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
      redirects: {
        "hello world": {
          id: "1",
          target: "https://www.google.com",
          token: "https://re.sajari.com/12345abcd",
        },
      },
    });

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      "test.com/sajari.api.pipeline.v1.Query/Search"
    );
  });
});
