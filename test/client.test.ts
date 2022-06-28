import { server, rest } from "./server";
import { APIClient, QueryResponse } from "../src/client";

describe("APIClient", () => {
  const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  const client = new APIClient("a", "b", "test.api.io");

  test("non 200 response code throws error", async () => {
    server.use(
      rest.post(
        "https://test.api.io/v4/collections/b:query",
        async (_, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ code: 13, message: "something bad happened" })
          );
        }
      )
    );

    await expect(
      client.query({
        tracking: { type: "NONE" },
        variables: { q: "test" },
      })
    ).rejects.toThrow("Request failed due to an error.");
  });

  test("happy path works", async () => {
    server.use(
      rest.post(
        "https://test.api.io/v4/collections/b:query",
        async (_, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json<QueryResponse>({
              pipeline: { name: "test", version: "test" },
              total_size: "0",
              processing_time: "0s",
            })
          );
        }
      )
    );

    await expect(
      client.query({
        tracking: { type: "NONE" },
        variables: { q: "test" },
      })
    ).resolves.toStrictEqual<QueryResponse>({
      pipeline: { name: "test", version: "test" },
      total_size: "0",
      processing_time: "0s",
    });
  });
});
