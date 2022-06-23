import { server, rest } from "./server";
import { Client, RequestError, SearchResponse } from "../src";
import { QueryResponse } from "../src/client";

describe("Client", () => {
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  test("works with successful response", async () => {
    server.use(
      rest.post(
        "https://test-jsonapi.search.io/v4/collections/col1:query",
        async (_, res, ctx) =>
          res(
            ctx.status(200),
            ctx.json<QueryResponse>({
              pipeline: { name: "test", version: "test" },
              total_size: "1",
              processing_time: "0.000954s",
              results: [
                {
                  record: {
                    _id: "7de7b946-4283-6407-4a94-b05e822af666",
                    f1: "v1",
                    f2: "v2",
                  },
                  index_score: 0.0625,
                  score: 0.0625,
                  neural_score: 0.0625,
                  feature_score: 0.0625,
                  relevance_score: 0.0625,
                },
              ],
              feature_score_weight: 0.2,
            })
          )
      )
    );

    const client = new Client("acc1", "col1", "test-jsonapi.search.io");
    const [resp] = await client.pipeline().search({
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
          featureScore: 0.0625,
          neuralScore: 0.0625,
          score: 0.0625,
          values: {
            _id: "7de7b946-4283-6407-4a94-b05e822af666",
            f1: "v1",
            f2: "v2",
          },
          promotionPinned: false,
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
        "https://test-jsonapi.search.io/v4/collections/col1:query",
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

    const client = new Client("acc1", "col1", "test-jsonapi.search.io");

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

  // NOTE(bhinchley): not sure this test is needed, not sure why the api
  // would return a non json response.
  test.skip("works with non-JSON erroring response", async () => {
    server.use(
      rest.post(
        "https://test-jsonapi.search.io/v4/collections/col1:query",
        async (_, res, ctx) =>
          res(ctx.status(500), ctx.text("plain text error"))
      )
    );

    const client = new Client("acc1", "col1", "test-jsonapi.search.io");

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
