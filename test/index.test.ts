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
      redirects: {},
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
          token: "12345abcd",
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
          token: "https://re.sajari.com/token/12345abcd",
        },
      },
    });

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      "test.com/sajari.api.pipeline.v1.Query/Search"
    );
  });

  it("process proto values", async () => {
    const responseObj: SearchResponseProto = {
      searchResponse: {
        time: "0.003s",
        totalResults: "1",
        results: [
          {
            indexScore: 1,
            score: 0.4649218,
            values: {
              neuralTitleHash: {
                singleBytes: "JmW0p9EzjBH...",
              },
            },
          },
        ],
      },
    };
    fetchMock.mockResponseOnce(JSON.stringify(responseObj));

    const session = new DefaultSession(TrackingType.None, "url");
    const [response, values] = await client
      .pipeline("test", "test")
      .search({ q: "" }, session.next());

    expect(values).toEqual({});
    expect(response).toStrictEqual({
      time: 0.003,
      totalResults: 1,
      results: [
        {
          indexScore: 1,
          score: 0.4649218,
          token: undefined,
          values: {
            neuralTitleHash: "JmW0p9EzjBH...",
          },
          promotionPinned: false,
        },
      ],
      aggregates: {},
      aggregateFilters: {},
      redirects: {},
    });
  });

  it("search with promotions", async () => {
    const responseObj: SearchResponseProto = {
      searchResponse: {
        time: "0.003s",
        totalResults: "2",
        results: [
          {
            indexScore: 1,
            score: 0.231125,
            values: {
              _id: { single: "876120cc-c9c6-95f2-bafb-58b8e2aa962f" },
            },
          },
          {
            indexScore: 1,
            score: 0.12938,
            values: {
              _id: { single: "ac369f52-1d84-b28b-5d08-22d5ba9ddeac" },
            },
          },
        ],
      },
      activePromotions: [
        {
          promotionId: "1",
          activePins: [
            {
              key: {
                field: "_id",
                value: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
              },
              position: 1,
            },
          ],
          activeExclusions: [],
        },
      ],
    };
    fetchMock.mockResponseOnce(JSON.stringify(responseObj));

    const session = new DefaultSession(TrackingType.None, "url");
    const [response, values] = await client
      .pipeline("test", "test")
      .search({ q: "hello" }, session.next());

    expect(values).toEqual({});
    expect(response).toStrictEqual({
      time: 0.003,
      totalResults: 2,
      results: [
        {
          indexScore: 1,
          score: 0.231125,
          token: undefined,
          values: {
            _id: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
          },
          promotionPinned: true,
        },
        {
          indexScore: 1,
          score: 0.12938,
          token: undefined,
          values: {
            _id: "ac369f52-1d84-b28b-5d08-22d5ba9ddeac",
          },
          promotionPinned: false,
        },
      ],
      aggregates: {},
      aggregateFilters: {},
      redirects: {},
    });

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      "test.com/sajari.api.pipeline.v1.Query/Search"
    );
  });

  it("search with promotions that have active pins with different key fields", async () => {
    const responseObj: SearchResponseProto = {
      searchResponse: {
        time: "0.003s",
        totalResults: "3",
        results: [
          {
            indexScore: 1,
            score: 0.231125,
            values: {
              _id: { single: "876120cc-c9c6-95f2-bafb-58b8e2aa962f" },
              sku: { single: "sku-1" },
              name: { single: "apple" },
            },
          },
          {
            indexScore: 1,
            score: 0.12938,
            values: {
              _id: { single: "ac369f52-1d84-b28b-5d08-22d5ba9ddeac" },
              sku: { single: "sku-2" },
              name: { single: "orange" },
            },
          },
          {
            indexScore: 1,
            score: 0.12341,
            values: {
              _id: { single: "bx874f21-9sj2-h12l-2e9d-j219dsjdk971" },
              sku: { single: "sku-3" },
              name: { single: "pear" },
            },
          },
        ],
      },
      activePromotions: [
        {
          promotionId: "1",
          activePins: [
            {
              key: {
                field: "_id",
                value: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
              },
              position: 1,
            },
            {
              key: {
                field: "sku",
                value: "sku-2",
              },
              position: 4,
            },
          ],
          activeExclusions: [],
        },
        {
          promotionId: "2",
          activePins: [
            {
              key: {
                field: "name",
                value: "pear",
              },
              position: 2,
            },
          ],
          activeExclusions: [],
        },
      ],
    };
    fetchMock.mockResponseOnce(JSON.stringify(responseObj));

    const session = new DefaultSession(TrackingType.None, "url");
    const [response, values] = await client
      .pipeline("test", "test")
      .search({ q: "hello" }, session.next());

    expect(values).toEqual({});
    expect(response).toStrictEqual({
      time: 0.003,
      totalResults: 3,
      results: [
        {
          indexScore: 1,
          score: 0.231125,
          token: undefined,
          values: {
            _id: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
            sku: "sku-1",
            name: "apple",
          },
          promotionPinned: true,
        },
        {
          indexScore: 1,
          score: 0.12938,
          token: undefined,
          values: {
            _id: "ac369f52-1d84-b28b-5d08-22d5ba9ddeac",
            sku: "sku-2",
            name: "orange",
          },
          promotionPinned: true,
        },
        {
          indexScore: 1,
          score: 0.12341,
          token: undefined,
          values: {
            _id: "bx874f21-9sj2-h12l-2e9d-j219dsjdk971",
            sku: "sku-3",
            name: "pear",
          },
          promotionPinned: true,
        },
      ],
      aggregates: {},
      aggregateFilters: {},
      redirects: {},
    });

    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      "test.com/sajari.api.pipeline.v1.Query/Search"
    );
  });
});
