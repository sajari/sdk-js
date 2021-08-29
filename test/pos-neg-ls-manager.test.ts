import {
  Client,
  PosNegLocalStorageManager,
  POS_NEG_STORAGE_KEY,
} from "../src/index";

const client = new Client("test", "test", "test.com");
const DEFAULT_TOKEN_IDENTIFIER = "default-token-identifier";
const DEFAULT_TOKEN = { pos: "default-pos-token", neg: "default-neg-token" };

describe("PosNegLocalStorageManager", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    // Reset local storage to contain a default posnegtoken
    localStorage.setItem(
      POS_NEG_STORAGE_KEY,
      JSON.stringify({
        [DEFAULT_TOKEN_IDENTIFIER]: {
          clickSubmitted: false,
          token: DEFAULT_TOKEN,
        },
      })
    );
  });

  it("add leaves other items alone", () => {
    const manager = new PosNegLocalStorageManager(client);
    manager.add("productIdentifier", {
      pos: "positive-token",
      neg: "negative-token",
    });
    expect(manager.get(DEFAULT_TOKEN_IDENTIFIER)?.token).toEqual(DEFAULT_TOKEN);
  });

  it("add adds expected item", () => {
    const field = "productIdentifier";
    const token = { pos: "positive-token", neg: "negative-token" };
    const manager = new PosNegLocalStorageManager(client);
    manager.add(field, token);
    expect(manager.get(field)?.token).toEqual(token);
  });

  it("add adds expected item", () => {
    const field = "productIdentifier";
    const token = { pos: "positive-token", neg: "negative-token" };
    const manager = new PosNegLocalStorageManager(client);
    manager.add(field, token);
    expect(manager.get(field)?.token).toEqual(token);
  });

  it("sendPosEvent calls client", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
    const manager = new PosNegLocalStorageManager(client);

    manager.sendPosEvent(DEFAULT_TOKEN_IDENTIFIER, "test", 1);
    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      "test.com/sajari.interaction.v2.Interaction/ConsumeToken"
    );
  });

  it("sendClickEvent consumes token", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
    const manager = new PosNegLocalStorageManager(client);

    manager.sendClickEvent(DEFAULT_TOKEN_IDENTIFIER);
    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(fetchMock.mock.calls[0][0]).toEqual(
      "test.com/sajari.interaction.v2.Interaction/ConsumeToken"
    );
  });

  it("sendClickEvent does not consume already clicked token", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
    localStorage.setItem(
      POS_NEG_STORAGE_KEY,
      JSON.stringify({
        [DEFAULT_TOKEN_IDENTIFIER]: {
          //Note token already consumed for test purposes
          clickSubmitted: true,
          token: DEFAULT_TOKEN,
        },
      })
    );
    const manager = new PosNegLocalStorageManager(client);

    manager.sendClickEvent(DEFAULT_TOKEN_IDENTIFIER);
    expect(fetchMock.mock.calls.length).toEqual(0);
  });

  it("sendClickEvent flips clicked to true", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
    const manager = new PosNegLocalStorageManager(client);

    manager.sendClickEvent(DEFAULT_TOKEN_IDENTIFIER);
    expect(manager.get(DEFAULT_TOKEN_IDENTIFIER)?.clickSubmitted).toBe(true);
  });

  it("sendClickEvent updates local storage", () => {
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
    const manager = new PosNegLocalStorageManager(client);
    manager.sendClickEvent(DEFAULT_TOKEN_IDENTIFIER);

    const storageString = localStorage.getItem(POS_NEG_STORAGE_KEY);
    if (storageString === null) {
      expect(storageString).toBeTruthy();
      return;
    }
    const storage = JSON.parse(storageString);
    expect(storage[DEFAULT_TOKEN_IDENTIFIER]?.clickSubmitted).toBe(true);
  });

  it("send pending clicks clicks all currently unclicked items", () => {
    fetchMock.mockResponse(JSON.stringify({ success: true }));
    const manager = new PosNegLocalStorageManager(client);
    manager.add("productIdentifier", {
      pos: "positive-token",
      neg: "negative-token",
    });
    manager.sendPendingClicks();

    expect(fetchMock.mock.calls.length).toEqual(2);
    expect(manager.get("productIdentifier")?.clickSubmitted).toEqual(true);
    expect(manager.get(DEFAULT_TOKEN_IDENTIFIER)?.clickSubmitted).toEqual(true);
  });

  it("send pending clicks clicks all currently unclicked items", () => {
    fetchMock.mockResponse(JSON.stringify({ success: true }));
    localStorage.setItem(
      POS_NEG_STORAGE_KEY,
      JSON.stringify({
        [DEFAULT_TOKEN_IDENTIFIER]: {
          //Note token already consumed for test purposes
          clickSubmitted: true,
          token: DEFAULT_TOKEN,
        },
      })
    );
    const manager = new PosNegLocalStorageManager(client);
    manager.add("productIdentifier", {
      pos: "positive-token",
      neg: "negative-token",
    });
    manager.sendPendingClicks();

    // Ensure only one consume call is made, indicating that both items were not submitted.
    expect(fetchMock.mock.calls.length).toEqual(1);
    expect(manager.get("productIdentifier")?.clickSubmitted).toEqual(true);
    expect(manager.get(DEFAULT_TOKEN_IDENTIFIER)?.clickSubmitted).toEqual(true);
  });
});
