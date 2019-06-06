import { FetchMock } from "jest-fetch-mock/types";

declare module NodeJS {
  interface Global {
    fetch: FetchMock;
  }
}
