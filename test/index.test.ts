import { Client, setItem } from "../src/index";
// import { USER_AGENT } from "../src/user-agent";
import { server, rest } from "./server";
import { QueryResponse } from "../src/client";

describe("setItem", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const setItemMock = jest.spyOn(
    Object.getPrototypeOf(localStorage),
    "setItem"
  );
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("catches exceptions", () => {
    setItemMock.mockImplementationOnce(() => {
      throw new Error("pretend QuotaExceededError");
    });

    expect(() => {
      setItem("foo", "bar");
    }).not.toThrowError();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Search.io local storage "foo" cannot be saved.',
      "bar"
    );
    expect(setItemMock).toHaveBeenCalled();
  });
});

describe("Pipeline", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const client = new Client("test", "test", "test.com");

  it("search", async () => {
    server.use(
      rest.post(
        "https://test.com/v4/collections/test:query",
        async (_, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json<QueryResponse>({
              pipeline: { name: "test", version: "test" },
              processing_time: "0.003s",
              total_size: "0",
            })
          );
        }
      )
    );

    const [response, values] = await client.pipeline().search({ q: "hello" });

    expect(values).toEqual({});
    expect(response).toStrictEqual({
      time: 0.003,
      totalResults: 0,
      results: [],
      aggregates: {},
      aggregateFilters: {},
      redirects: {},
      activePromotions: [],
      featureScoreWeight: 0,
      banners: undefined,
    });
  });

  // it("search with redirects", async () => {
  //   const responseObj: QueryResponse = {
  //     pipeline: { name: "test", version: "test" },
  //     processing_time: "0.003s",
  //     total_size: "0",
  //     redirects: {
  //       "hello world": {
  //         id: "1",
  //         target: "https://www.google.com",
  //       },
  //     },
  //   };
  //   fetchMock.mockResponseOnce(JSON.stringify(responseObj));

  //   const [response, values] = await client
  //     .pipeline("test", "test")
  //     .search({ q: "hello" });

  //   expect(values).toEqual({});
  //   expect(response).toStrictEqual({
  //     banners: undefined,
  //     time: 0.003,
  //     totalResults: 0,
  //     results: [],
  //     aggregates: {},
  //     aggregateFilters: {},
  //     redirects: {
  //       "hello world": {
  //         id: "1",
  //         target: "https://www.google.com",
  //         token: "https://re.sajari.com/token/12345abcd",
  //       },
  //     },
  //     activePromotions: [],
  //     featureScoreWeight: 0,
  //   });

  //   expect(fetchMock.mock.calls.length).toEqual(1);
  //   expect(fetchMock.mock.calls[0][0]).toEqual(
  //     "test.com/sajari.api.pipeline.v1.Query/Search"
  //   );
  // });

  // it("process proto values", async () => {
  //   const responseObj: QueryResponse = {
  //     pipeline: { name: "test", version: "test" },
  //     processing_time: "0.003s",
  //     total_size: "1",
  //     results: [
  //       {
  //         index_score: 1,
  //         score: 0.4649218,
  //         record: {
  //           neuralTitleHash: "JmW0p9EzjBH...",
  //         },
  //       },
  //     ],
  //   };
  //   fetchMock.mockResponseOnce(JSON.stringify(responseObj));

  //   const [response, values] = await client
  //     .pipeline("test", "test")
  //     .search({ q: "" });

  //   expect(values).toEqual({});
  //   expect(response).toStrictEqual({
  //     banners: undefined,
  //     time: 0.003,
  //     totalResults: 1,
  //     results: [
  //       {
  //         indexScore: 1,
  //         score: 0.4649218,
  //         token: undefined,
  //         values: {
  //           neuralTitleHash: "JmW0p9EzjBH...",
  //         },
  //         promotionPinned: false,
  //       },
  //     ],
  //     aggregates: {},
  //     aggregateFilters: {},
  //     redirects: {},
  //     activePromotions: [],
  //     featureScoreWeight: 0,
  //   });
  // });

  // it("search with promotions", async () => {
  //   const responseObj: QueryResponse = {
  //     pipeline: { name: "test", version: "test" },
  //     processing_time: "0.003s",
  //     total_size: "2",
  //     results: [
  //       {
  //         index_score: 1,
  //         score: 0.231125,
  //         record: {
  //           _id: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
  //         },
  //       },
  //       {
  //         index_score: 1,
  //         score: 0.12938,
  //         record: {
  //           _id: "ac369f52-1d84-b28b-5d08-22d5ba9ddeac",
  //         },
  //       },
  //     ],
  //     active_promotions: [
  //       {
  //         promotion_id: "1",
  //         active_pins: [
  //           {
  //             key: {
  //               field: "_id",
  //               value: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
  //             },
  //             position: 1,
  //           },
  //         ],
  //         active_exclusions: [],
  //       },
  //     ],
  //   };
  //   fetchMock.mockResponseOnce(JSON.stringify(responseObj));

  //   const [response, values] = await client
  //     .pipeline("test", "test")
  //     .search({ q: "hello" });

  //   expect(values).toEqual({});
  //   expect(response).toStrictEqual({
  //     banners: undefined,
  //     time: 0.003,
  //     totalResults: 2,
  //     results: [
  //       {
  //         indexScore: 1,
  //         score: 0.231125,
  //         token: undefined,
  //         values: {
  //           _id: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
  //         },
  //         promotionPinned: true,
  //       },
  //       {
  //         indexScore: 1,
  //         score: 0.12938,
  //         token: undefined,
  //         values: {
  //           _id: "ac369f52-1d84-b28b-5d08-22d5ba9ddeac",
  //         },
  //         promotionPinned: false,
  //       },
  //     ],
  //     aggregates: {},
  //     aggregateFilters: {},
  //     redirects: {},
  //     featureScoreWeight: 0,
  //     activePromotions: [
  //       {
  //         activeExclusions: [],
  //         activePins: [
  //           {
  //             key: {
  //               field: "_id",
  //               value: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
  //             },
  //             position: 1,
  //           },
  //         ],
  //         promotionId: "1",
  //       },
  //     ],
  //   });

  //   expect(fetchMock.mock.calls.length).toEqual(1);
  //   expect(fetchMock.mock.calls[0][0]).toEqual(
  //     "test.com/sajari.api.pipeline.v1.Query/Search"
  //   );
  // });

  // it("search with promotions that have active pins with different key fields", async () => {
  //   const responseObj: QueryResponse = {
  //     pipeline: { name: "test", version: "test" },
  //     processing_time: "0.003s",
  //     total_size: "3",
  //     results: [
  //       {
  //         index_score: 1,
  //         score: 0.231125,
  //         record: {
  //           _id: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
  //           sku: "sku-1",
  //           name: "apple",
  //         },
  //       },
  //       {
  //         index_score: 1,
  //         score: 0.12938,
  //         record: {
  //           _id: "ac369f52-1d84-b28b-5d08-22d5ba9ddeac",
  //           sku: "sku-2",
  //           name: "orange",
  //         },
  //       },
  //       {
  //         index_score: 1,
  //         score: 0.12341,
  //         record: {
  //           _id: "bx874f21-9sj2-h12l-2e9d-j219dsjdk971",
  //           sku: "sku-3",
  //           name: "pear",
  //         },
  //       },
  //     ],
  //     active_promotions: [
  //       {
  //         promotion_id: "1",
  //         active_pins: [
  //           {
  //             key: {
  //               field: "_id",
  //               value: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
  //             },
  //             position: 1,
  //           },
  //           {
  //             key: {
  //               field: "sku",
  //               value: "sku-2",
  //             },
  //             position: 4,
  //           },
  //         ],
  //         active_exclusions: [],
  //       },
  //       {
  //         promotion_id: "2",
  //         active_pins: [
  //           {
  //             key: {
  //               field: "name",
  //               value: "pear",
  //             },
  //             position: 2,
  //           },
  //         ],
  //         active_exclusions: [],
  //       },
  //     ],
  //   };
  //   fetchMock.mockResponseOnce(JSON.stringify(responseObj));

  //   const [response, values] = await client
  //     .pipeline("test", "test")
  //     .search({ q: "hello" });

  //   expect(values).toEqual({});
  //   expect(response).toStrictEqual({
  //     banners: undefined,
  //     time: 0.003,
  //     totalResults: 3,
  //     results: [
  //       {
  //         indexScore: 1,
  //         score: 0.231125,
  //         token: undefined,
  //         values: {
  //           _id: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
  //           sku: "sku-1",
  //           name: "apple",
  //         },
  //         promotionPinned: true,
  //       },
  //       {
  //         indexScore: 1,
  //         score: 0.12938,
  //         token: undefined,
  //         values: {
  //           _id: "ac369f52-1d84-b28b-5d08-22d5ba9ddeac",
  //           sku: "sku-2",
  //           name: "orange",
  //         },
  //         promotionPinned: true,
  //       },
  //       {
  //         indexScore: 1,
  //         score: 0.12341,
  //         token: undefined,
  //         values: {
  //           _id: "bx874f21-9sj2-h12l-2e9d-j219dsjdk971",
  //           sku: "sku-3",
  //           name: "pear",
  //         },
  //         promotionPinned: true,
  //       },
  //     ],
  //     aggregates: {},
  //     aggregateFilters: {},
  //     redirects: {},
  //     featureScoreWeight: 0,
  //     activePromotions: [
  //       {
  //         activeExclusions: [],
  //         activePins: [
  //           {
  //             key: {
  //               field: "_id",
  //               value: "876120cc-c9c6-95f2-bafb-58b8e2aa962f",
  //             },
  //             position: 1,
  //           },
  //           {
  //             key: {
  //               field: "sku",
  //               value: "sku-2",
  //             },
  //             position: 4,
  //           },
  //         ],
  //         promotionId: "1",
  //       },
  //       {
  //         activeExclusions: [],
  //         activePins: [
  //           {
  //             key: {
  //               field: "name",
  //               value: "pear",
  //             },
  //             position: 2,
  //           },
  //         ],
  //         promotionId: "2",
  //       },
  //     ],
  //   });

  //   expect(fetchMock.mock.calls.length).toEqual(1);
  //   expect(fetchMock.mock.calls[0][0]).toEqual(
  //     "test.com/sajari.api.pipeline.v1.Query/Search"
  //   );
  // });

  // it("search with promotions that have active pins with key fields that aren't in the values", async () => {
  //   consoleErrorSpy.mockImplementation();
  //   const responseObj: SearchResponseProto = {
  //     values: {
  //       "Published Date": "",
  //       autoUpdate: "true",
  //       reinforcements: "",
  //       reinforcementsDir1: "",
  //       "url-boost": "",
  //     },
  //     searchResponse: {
  //       totalResults: "3",
  //       time: "0.000920s",
  //       results: [
  //         {
  //           values: {
  //             description: {
  //               single:
  //                 "Get energised this festive season by adding veggie powder to this deliciously sweet breakfast bowl of goodness.",
  //             },
  //             modified_time: { single: "2020-08-27T00:00:00Z" },
  //             title: { single: "Beetroot smoothie bowl" },
  //             url: {
  //               single:
  //                 "https://www.nsw.gov.au/regional-nsw/buy-regional/flavours-from-bush/beetroot-smoothie-bowl",
  //             },
  //           },
  //           score: 0.2873631800518135,
  //           indexScore: 0.0625,
  //           neuralScore: 0.627734375,
  //           featureScore: 0.18134715025906734,
  //         },
  //         {
  //           values: {
  //             description: {
  //               single:
  //                 "Perfect for entertaining in a hurry, this recipe uses Labelle, a yoghurt cheese with a deliciously smooth texture.",
  //             },
  //             modified_time: { single: "2020-07-23T00:00:00Z" },
  //             title: { single: "Entertaining Laballe" },
  //             url: {
  //               single:
  //                 "https://www.nsw.gov.au/regional-nsw/buy-regional/flavours-from-bush/entertaining-laballe",
  //             },
  //           },
  //           score: 0.2790038050518135,
  //           neuralScore: 0.6068359375,
  //           featureScore: 0.18134715025906734,
  //           indexScore: 0.30341796875,
  //         },
  //         {
  //           values: {
  //             description: {
  //               single:
  //                 "Use top drawer Australian Iron Bark honey in this recipe – it’s beautifully mellow and is a favourite flavour booster in baking.",
  //             },
  //             modified_time: { single: "2020-07-23T00:00:00Z" },
  //             title: { single: "Superbee Honey banana bread" },
  //             url: {
  //               single:
  //                 "https://www.nsw.gov.au/regional-nsw/buy-regional/flavours-from-bush/superbee-honey-banana-bread",
  //             },
  //           },
  //           score: 0.44248704663212435,
  //           neuralScore: 0.678515625,
  //           featureScore: 0.21243523316062174,
  //           indexScore: 0.5,
  //         },
  //       ],
  //       featureScoreWeight: 0.2,
  //     },
  //     activePromotions: [
  //       {
  //         promotionId: "2G0kdSJX8Jpht5Dv2545u12OlAw",
  //         activePins: [
  //           {
  //             key: {
  //               field: "_id",
  //               value: "ef3e6ef2-b9e1-2393-9e38-4b424f099238",
  //             },
  //             position: 1,
  //           },
  //           {
  //             key: {
  //               field: "_id",
  //               value: "7d0aa8a8-63cb-be92-bb32-9b9c655b4356",
  //             },
  //             position: 2,
  //           },
  //         ],
  //       },
  //     ],
  //   };
  //   fetchMock.mockResponseOnce(JSON.stringify(responseObj));

  //   const session = new DefaultSession(TrackingType.Click, "url");
  //   const [response, values] = await client.pipeline("test", "test").search(
  //     {
  //       fields: "url,title,description,modified_time",
  //       q: "banana",
  //     },
  //     session.next()
  //   );

  //   expect(values).toEqual(responseObj.values);
  //   expect(response).toStrictEqual({
  //     banners: undefined,
  //     time: 0.00092,
  //     totalResults: 3,
  //     results: [
  //       {
  //         score: 0.2873631800518135,
  //         indexScore: 0.0625,
  //         neuralScore: 0.627734375,
  //         featureScore: 0.18134715025906734,
  //         token: undefined,
  //         values: {
  //           description:
  //             "Get energised this festive season by adding veggie powder to this deliciously sweet breakfast bowl of goodness.",
  //           modified_time: "2020-08-27T00:00:00Z",
  //           title: "Beetroot smoothie bowl",
  //           url: "https://www.nsw.gov.au/regional-nsw/buy-regional/flavours-from-bush/beetroot-smoothie-bowl",
  //         },
  //         promotionPinned: false,
  //       },
  //       {
  //         score: 0.2790038050518135,
  //         neuralScore: 0.6068359375,
  //         featureScore: 0.18134715025906734,
  //         indexScore: 0.30341796875,
  //         token: undefined,
  //         values: {
  //           description:
  //             "Perfect for entertaining in a hurry, this recipe uses Labelle, a yoghurt cheese with a deliciously smooth texture.",
  //           modified_time: "2020-07-23T00:00:00Z",
  //           title: "Entertaining Laballe",
  //           url: "https://www.nsw.gov.au/regional-nsw/buy-regional/flavours-from-bush/entertaining-laballe",
  //         },
  //         promotionPinned: false,
  //       },
  //       {
  //         score: 0.44248704663212435,
  //         neuralScore: 0.678515625,
  //         featureScore: 0.21243523316062174,
  //         indexScore: 0.5,
  //         token: undefined,
  //         values: {
  //           description:
  //             "Use top drawer Australian Iron Bark honey in this recipe – it’s beautifully mellow and is a favourite flavour booster in baking.",
  //           modified_time: "2020-07-23T00:00:00Z",
  //           title: "Superbee Honey banana bread",
  //           url: "https://www.nsw.gov.au/regional-nsw/buy-regional/flavours-from-bush/superbee-honey-banana-bread",
  //         },
  //         promotionPinned: false,
  //       },
  //     ],
  //     aggregates: {},
  //     aggregateFilters: {},
  //     redirects: {},
  //     featureScoreWeight: 0.2,
  //     activePromotions: [
  //       {
  //         promotionId: "2G0kdSJX8Jpht5Dv2545u12OlAw",
  //         activePins: [
  //           {
  //             key: {
  //               field: "_id",
  //               value: "ef3e6ef2-b9e1-2393-9e38-4b424f099238",
  //             },
  //             position: 1,
  //           },
  //           {
  //             key: {
  //               field: "_id",
  //               value: "7d0aa8a8-63cb-be92-bb32-9b9c655b4356",
  //             },
  //             position: 2,
  //           },
  //         ],
  //       },
  //     ],
  //   });

  //   expect(fetchMock.mock.calls.length).toEqual(1);
  //   expect(fetchMock.mock.calls[0][0]).toEqual(
  //     "test.com/sajari.api.pipeline.v1.Query/Search"
  //   );
  //   responseObj.searchResponse?.results?.forEach(({ values }) =>
  //     expect(consoleErrorSpy).toHaveBeenCalledWith(
  //       'Pin key field "_id" not found in values.',
  //       values
  //     )
  //   );
  // });

  // it("search with neural and feature scores", async () => {
  //   const responseObj: QueryResponse = {
  //     pipeline: { name: "test", version: "test" },
  //     processing_time: "0.003s",
  //     total_size: "1",
  //     feature_score_weight: 0.2,
  //     results: [
  //       {
  //         index_score: 1,
  //         score: 0.4649218,
  //         neural_score: 0.333,
  //         feature_score: 0.6666,
  //         record: {
  //           title: "the result",
  //         },
  //       },
  //     ],
  //   };
  //   fetchMock.mockResponseOnce(JSON.stringify(responseObj));

  //   const [response, values] = await client
  //     .pipeline("test", "test")
  //     .search({ q: "hello" });

  //   expect(values).toEqual({});
  //   expect(response).toStrictEqual({
  //     banners: undefined,
  //     time: 0.003,
  //     totalResults: 1,
  //     results: [
  //       {
  //         indexScore: 1,
  //         score: 0.4649218,
  //         promotionPinned: false,
  //         token: undefined,
  //         neuralScore: 0.333,
  //         featureScore: 0.6666,
  //         values: {
  //           title: "the result",
  //         },
  //       },
  //     ],
  //     aggregates: {},
  //     aggregateFilters: {},
  //     activePromotions: [],
  //     redirects: {},
  //     featureScoreWeight: 0.2,
  //   });

  //   expect(fetchMock.mock.calls.length).toEqual(1);
  //   expect(fetchMock.mock.calls[0][0]).toEqual(
  //     "test.com/sajari.api.pipeline.v1.Query/Search"
  //   );
  // });

  // it("search with banners", async () => {
  //   const responseObj: QueryResponse = {
  //     pipeline: { name: "version", version: "name" },
  //     processing_time: "0.003s",
  //     total_size: "0",
  //     results: [],
  //     banners: [
  //       {
  //         height: 2,
  //         id: "1",
  //         image_url: "imageUrl",
  //         position: 5,
  //         target_url: "targetUrl",
  //         width: 2,
  //       },
  //     ],
  //   };
  //   fetchMock.mockResponseOnce(JSON.stringify(responseObj));

  //   const [response, values] = await client
  //     .pipeline("test", "test")
  //     .search({ q: "hello" });

  //   expect(values).toEqual({});
  //   expect(response).toStrictEqual({
  //     time: 0.003,
  //     totalResults: 0,
  //     banners: [
  //       {
  //         height: 2,
  //         id: "1",
  //         imageUrl: "imageUrl",
  //         position: 5,
  //         targetUrl: "targetUrl",
  //         width: 2,
  //       },
  //     ],
  //     featureScoreWeight: 0,
  //     results: [],
  //     aggregates: {},
  //     aggregateFilters: {},
  //     activePromotions: [],
  //     redirects: {},
  //   });
  //   expect(fetchMock.mock.calls.length).toEqual(1);
  //   expect(fetchMock.mock.calls[0][0]).toEqual(
  //     "test.com/sajari.api.pipeline.v1.Query/Search"
  //   );
  // });

  // it("search request with simplified tracking", async () => {
  //   const responseObj: QueryResponse = {
  //     pipeline: { name: "test", version: "test" },
  //     processing_time: "0.003s",
  //     total_size: "0",
  //     results: [],
  //     banners: [],
  //     query_id: "1f2d7ae0-fdd6-4eaf-85e9-cb5f3256e8c4",
  //   };
  //   fetchMock.mockResponseOnce(JSON.stringify(responseObj));

  //   const [response, values] = await client
  //     .pipeline("test", "test")
  //     .search({ q: "hello" });

  //   expect(values).toEqual({});
  //   expect(response).toStrictEqual({
  //     time: 0.003,
  //     totalResults: 0,
  //     banners: [],
  //     featureScoreWeight: 0,
  //     results: [],
  //     aggregates: {},
  //     aggregateFilters: {},
  //     activePromotions: [],
  //     redirects: {},
  //     queryId: "1f2d7ae0-fdd6-4eaf-85e9-cb5f3256e8c4",
  //   });
  //   expect(fetchMock.mock.calls.length).toEqual(1);
  //   const firstCall = fetchMock.mock.calls[0];
  //   expect(firstCall[0]).toEqual(
  //     "test.com/sajari.api.pipeline.v1.Query/Search"
  //   );
  //   const bodyParsed = JSON.parse(firstCall[1]!.body as any);
  //   expect(bodyParsed).toEqual({
  //     metadata: {
  //       project: ["test"],
  //       collection: ["test"],
  //       "user-agent": [USER_AGENT],
  //     },
  //     request: {
  //       pipeline: {
  //         name: "test",
  //         version: "test",
  //       },
  //       tracking: {
  //         query_id: "test-query-id",
  //         type: "EVENT",
  //         sequence: 0,
  //         field: "url",
  //         data: {},
  //       },
  //       values: {
  //         q: "hello",
  //       },
  //     },
  //   });
  // });
});
