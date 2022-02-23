import fetchPonyfill from "fetch-ponyfill";
import { server, rest } from "./server";
import { Client, RequestError, SearchResponse } from "../src";

describe("Client", () => {
  // NOTE(jingram): The test suite mocks fetch but these tests specifically
  // avoid mocking fetch so we can test real requests. So we need to make sure
  // to put fetch back to what it was.
  let oldFetch: typeof fetch;
  beforeAll(() => {
    oldFetch = global.fetch;
    global.fetch = fetchPonyfill().fetch;
  });
  afterAll(() => {
    global.fetch = oldFetch;
  });

  test("works with successful response", async () => {
    server.use(
      rest.post(
        "https://test-jsonapi.search.io/sajari.api.pipeline.v1.Query/Search",
        async (_, res, ctx) =>
          res(
            ctx.status(200),
            ctx.json({
              searchResponse: {
                reads: "1",
                totalResults: "1",
                time: "0.000954s",
                results: [
                  {
                    values: {
                      _id: { single: "7de7b946-4283-6407-4a94-b05e822af666" },
                      f1: { single: "v1" },
                      f2: { single: "v2" },
                    },
                    indexScore: 0.0625,
                  },
                ],
                featureScoreWeight: 0.2,
              },
            })
          )
      )
    );

    const client = new Client("acc1", "col1", "https://test-jsonapi.search.io");
    const [resp] = await client.pipeline("my-query-pipeline", "1").search({
      q: "my search query",
    });

    const wantResp: SearchResponse = {
      time: 0.000954,
      totalResults: 1,
      banners: undefined,
      featureScoreWeight: 0.2,
      results: [
        {
          indexScore: 0.0625,
          // @ts-ignore - Types are wrong because backend can return undefined.
          score: undefined,
          values: {
            _id: "7de7b946-4283-6407-4a94-b05e822af666",
            f1: "v1",
            f2: "v2",
          },
          promotionPinned: false,
          token: undefined,
        },
      ],
      aggregateFilters: {},
      aggregates: {},
      redirects: {},
      activePromotions: [],
    };

    expect(resp).toEqual(wantResp);
  });

  test("works with erroring response", async () => {
    server.use(
      rest.post(
        "https://test-jsonapi.search.io/sajari.api.pipeline.v1.Query/Search",
        async (_, res, ctx) =>
          res(
            ctx.status(500),
            ctx.json({
              message: "internal server error",
              code: 13,
            })
          )
      )
    );

    const client = new Client("acc1", "col1", "https://test-jsonapi.search.io");

    await expect(
      client.pipeline("my-query-pipeline", "1").search({
        q: "my search query",
      })
    ).rejects.toThrow(RequestError);
    await expect(
      client.pipeline("my-query-pipeline", "1").search({
        q: "my search query",
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 500,
        error: new Error("internal server error"),
      })
    );
  });

  test("works with non-JSON erroring response", async () => {
    server.use(
      rest.post(
        "https://test-jsonapi.search.io/sajari.api.pipeline.v1.Query/Search",
        async (_, res, ctx) =>
          res(ctx.status(500), ctx.text("plain text error"))
      )
    );

    const client = new Client("acc1", "col1", "https://test-jsonapi.search.io");

    await expect(
      client.pipeline("my-query-pipeline", "1").search({
        q: "my search query",
      })
    ).rejects.toThrow(RequestError);
    await expect(
      client.pipeline("my-query-pipeline", "1").search({
        q: "my search query",
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 500,
        error: new Error("Internal Server Error"),
      })
    );
  });
});
