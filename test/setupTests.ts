import { server } from "./server";

// Real backend server with stubbed responses.
beforeAll(() =>
  server.listen({
    onUnhandledRequest: "error",
  })
);

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
