// import fetchPonyfill from "fetch-ponyfill";
import { Client } from "../src/client";
import { server, rest } from "./server";

describe("Client v4", () => {
  //   // NOTE(jingram): The test suite mocks fetch but these tests specifically
  //   // avoid mocking fetch so we can test real requests. So we need to make sure
  //   // to put fetch back to what it was.
  //   let oldFetch: typeof fetch;
  //   const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  //   beforeAll(() => {
  //     oldFetch = global.fetch;
  //     global.fetch = fetchPonyfill().fetch;
  //   });
  //   afterAll(() => {
  //     global.fetch = oldFetch;
  //     consoleErrorSpy.mockRestore();
  //   });

  test("succesfully makes a request", async () => {
    server.use(
      rest.post("https://test.io/v4/collections/b:query", (_, res, ctx) => {
        console.log("here 4");
        return res(
          ctx.status(200),
          ctx.json({
            pipeline: { name: "test", version: "test" },
          })
        );
      })
    );

    const client = new Client("a", "b", "test.io");

    const resp = await client.query({
      tracking: { type: "NONE" },
      variables: { q: "test" },
    });

    expect(resp).toBe({});
  });
});
