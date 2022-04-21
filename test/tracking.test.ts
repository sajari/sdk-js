import { SearchIOAnalytics, STORAGE_KEY } from "../src/tracking";

expect.extend({
  toHaveBeenCalledBefore(spy1: jest.SpyInstance, spy2: jest.SpyInstance) {
    const mostRecentInvocationOrder = (spy: jest.SpyInstance) =>
      spy.mock.invocationCallOrder[
        Object.keys(spy.mock.invocationCallOrder).length - 1
      ];
    return {
      message: () =>
        "expected first mock to have been called before second mock",
      pass: mostRecentInvocationOrder(spy1) < mostRecentInvocationOrder(spy2),
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledBefore(spy: jest.SpyInstance): R;
    }
  }
}

const setItemSpy = jest.spyOn(Object.getPrototypeOf(localStorage), "setItem");
const sendEventSpy = jest.spyOn(SearchIOAnalytics.prototype, "sendEvent");
const consoleErrorSpy = jest.spyOn(console, "error");
const saveSpy = jest.spyOn(SearchIOAnalytics.prototype, "save");
const flushSpy = jest.spyOn(SearchIOAnalytics.prototype, "flush");
const addSpy = jest.spyOn(SearchIOAnalytics.prototype, "add");
const trackForQuerySpy = jest.spyOn(
  SearchIOAnalytics.prototype,
  "trackForQuery"
);
const purgeSpy = jest.spyOn(SearchIOAnalytics.prototype, "purge");

const eventState = {
  queryId: "abc123",
  type: "click",
  timestamp: Date.now(),
  submitted: true,
};

describe("SearchIOAnalytics", () => {
  afterEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
    consoleErrorSpy.mockImplementation();
    localStorage.removeItem(STORAGE_KEY);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("initialises events to an empty object if localStorage is null", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      expect(analytics.events).toEqual({});
    });

    it("initialises events to an empty object if localStorage is corrupt", () => {
      localStorage.setItem(STORAGE_KEY, "{foo");
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      expect(analytics.events).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("initialises events to what is saved in localStorage", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sku1: [eventState],
        })
      );
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      expect(analytics.events).toEqual({
        sku1: [eventState],
      });
    });

    it("calls flush then purge", async () => {
      const success = Promise.resolve([]);
      flushSpy.mockReturnValueOnce(success);

      new SearchIOAnalytics("test_account", "test_collection");

      await success;

      expect(flushSpy).toHaveBeenCalled();
      expect(purgeSpy).toHaveBeenCalled();
      expect(flushSpy).toHaveBeenCalledBefore(purgeSpy);
    });
  });

  describe("sendEvent", () => {
    it("formats the payload correctly", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      fetchMock.mockResponseOnce("{}");

      analytics.sendEvent("abc123", "click", {
        result_id: "example_sku",
        metadata: { sessionId: 123 },
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.search.io/v4/collections/test_collection:trackEvent",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "text/plain",
            "Account-Id": "test_account",
          },
          body: JSON.stringify({
            query_id: "abc123",
            type: "click",
            result_id: "example_sku",
            metadata: { sessionId: 123 },
          }),
        }
      );
    });

    it("uses a custom endpoint when supplied", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection",
        "https://test.com"
      );

      fetchMock.mockResponseOnce("{}");

      analytics.sendEvent("abc123", "click", {
        result_id: "example_sku",
        metadata: { sessionId: 123 },
      });

      expect(fetchMock.mock.calls[0][0]).toEqual(
        "https://test.com/v4/collections/test_collection:trackEvent"
      );
    });

    it("handles messages in the status text", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      fetchMock.mockResponseOnce("{}", {
        status: 500,
        statusText: "custom error",
      });

      expect.assertions(3);
      return analytics
        .sendEvent("abc123", "click", { result_id: "example_sku" })
        .catch((err) => {
          expect(err.statusCode).toEqual(500);
          expect(err.message).toEqual(
            "Request failed due to a configuration error."
          );
          expect(err.error.message).toEqual("custom error");
        });
    });

    it("handles messages in the errors response", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      fetchMock.mockResponseOnce('{ "message": "custom error" }', {
        status: 500,
      });

      expect.assertions(3);
      return analytics
        .sendEvent("abc123", "click", { result_id: "example_sku" })
        .catch((err) => {
          expect(err.statusCode).toEqual(500);
          expect(err.message).toEqual(
            "Request failed due to a configuration error."
          );
          expect(err.error.message).toEqual("custom error");
        });
    });

    it("handles 403s", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      fetchMock.mockResponseOnce("", { status: 403, statusText: "Forbidden" });

      expect.assertions(3);
      return analytics
        .sendEvent("abc123", "click", { result_id: "example_sku" })
        .catch((err) => {
          expect(err.statusCode).toEqual(403);
          expect(err.message).toEqual(
            "This domain is not authorized to make this request."
          );
          expect(err.error.message).toEqual("Forbidden");
        });
    });
  });

  describe("save", () => {
    it("calls setItem with events", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events = {
        sku1: [eventState],
      };

      analytics.save();

      expect(setItemSpy).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({
          sku1: [eventState],
        })
      );
    });
  });

  describe("updateQueryId", () => {
    it("updates the current queryId", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      expect(analytics.queryId).toBeUndefined();

      analytics.updateQueryId("abc123");

      expect(analytics.queryId).toEqual("abc123");
    });
  });

  describe("setEvents", () => {
    it("sets the events for a value", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      analytics.setEvents("foo", [eventState]);

      expect(analytics.events["foo"]).toEqual([eventState]);
    });

    it("deletes the value if events is empty", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events = {
        foo: [eventState],
      };

      analytics.setEvents("foo", []);

      expect(analytics.events).not.toHaveProperty("foo");
    });
  });

  describe("getEvents", () => {
    it("gets the events for a value", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events["foo"] = [eventState];

      expect(analytics.getEvents("foo")).toEqual([eventState]);
    });

    it("gets an empty array if there are no events for a value", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      expect(analytics.events).toEqual({});
      expect(analytics.getEvents("foo")).toEqual([]);
    });
  });

  describe("getIdentifierForType", () => {
    const analytics = new SearchIOAnalytics("test_account", "test_collection");

    it("returns 'redirect_id' for redirects", () => {
      expect(analytics.getIdentifierForType("redirect")).toEqual("redirect_id");
    });

    it("returns 'banner_id' for promotions", () => {
      expect(analytics.getIdentifierForType("promotion_click")).toEqual(
        "banner_id"
      );
    });

    it("returns 'result_id' for anything else", () => {
      expect(analytics.getIdentifierForType("some other garbage")).toEqual(
        "result_id"
      );
    });
  });

  describe("add", () => {
    it("appends a new event for a value", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events["sku1"] = [eventState];

      analytics.add("abc123", "add_to_cart", "sku1");

      expect(analytics.events["sku1"]).toHaveLength(2);
      expect(analytics.events["sku1"][1]).toMatchObject({
        queryId: "abc123",
        type: "add_to_cart",
        submitted: false,
      });
    });

    it("calls save then flush", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      analytics.add("abc123", "add_to_cart", "sku1");

      expect(saveSpy).toHaveBeenCalled();
      expect(flushSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalledBefore(flushSpy);
    });
  });

  describe("trackForQuery", () => {
    it("calls add", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      analytics.trackForQuery("abc123", "add_to_cart", "sku1");

      expect(addSpy).toHaveBeenCalledWith(
        "abc123",
        "add_to_cart",
        "sku1",
        undefined
      );
    });
  });

  describe("track", () => {
    it("returns and logs an error if there is no current queryId", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      analytics.track("add_to_cart", "sku1");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(trackForQuerySpy).not.toHaveBeenCalled();
    });

    it("calls trackForQuery with current queryId", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      analytics.updateQueryId("abc123");
      analytics.track("add_to_cart", "sku1");

      expect(trackForQuerySpy).toHaveBeenCalledWith(
        "abc123",
        "add_to_cart",
        "sku1",
        undefined
      );
    });

    it("calls trackForQuery with queryId of previous event rather than current queryId", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events = {
        sku1: [eventState, { ...eventState, queryId: "ghi789" }],
      };

      analytics.updateQueryId("def456");
      analytics.track("add_to_cart", "sku1");

      expect(trackForQuerySpy).toHaveBeenCalledWith(
        "ghi789",
        "add_to_cart",
        "sku1",
        undefined
      );
    });

    it("top-of-funnel events with no queryId throw console error", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      // Top of funnel events don't look up previous query events
      analytics.events = {
        sku1: [eventState, { ...eventState, queryId: "ghi789" }],
      };

      // Note no queryId set ah la analytics.updateQueryId(...);
      analytics.track("promotion_click", "sku1");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(trackForQuerySpy).not.toHaveBeenCalled();
    });

    it("ad-hoc events with no previous event don't console error", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      // Top of funnel events look up previous query events but none exist for this `value`
      analytics.events = {
        sku1: [eventState, { ...eventState, queryId: "ghi789" }],
      };

      // Note no queryId set ah la analytics.updateQueryId(...);
      analytics.track("add_to_cart", "unique-value");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(trackForQuerySpy).not.toHaveBeenCalled();
    });

    it.each(["click", "redirect", "promotion_click"])(
      "calls trackForQuery with current queryId if type is %s",
      (type) => {
        const analytics = new SearchIOAnalytics(
          "test_account",
          "test_collection"
        );
        analytics.events = {
          sku1: [eventState, { ...eventState, queryId: "ghi789" }],
        };

        analytics.updateQueryId("def456");
        analytics.track(type, "sku1");

        expect(trackForQuerySpy).toHaveBeenCalledWith(
          "def456",
          type,
          "sku1",
          undefined
        );
      }
    );
  });

  describe("flush", () => {
    it("calls sendEvent for all unsubmitted events", async () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events = {
        foo: [
          eventState,
          {
            ...eventState,
            type: "add_to_cart",
            submitted: false,
          },
          {
            ...eventState,
            type: "purchase",
            submitted: false,
            metadata: {
              discount: 0.2,
              margin: 30.0,
              customer_id: "12345",
              ui_test_segment: "A",
            },
          },
        ],
        bar: [
          {
            ...eventState,
            type: "redirect",
            submitted: false,
          },
        ],
      };

      await analytics.flush();

      expect(sendEventSpy).toHaveBeenCalledTimes(3);
      expect(sendEventSpy).toHaveBeenCalledWith("abc123", "add_to_cart", {
        result_id: "foo",
      });
      expect(sendEventSpy).toHaveBeenCalledWith("abc123", "purchase", {
        result_id: "foo",
        metadata: {
          discount: 0.2,
          margin: 30.0,
          customer_id: "12345",
          ui_test_segment: "A",
        },
      });
      expect(sendEventSpy).toHaveBeenCalledWith("abc123", "redirect", {
        redirect_id: "bar",
      });
    });

    it("marks events as submitted if sendEvent succeeds and calls save", async () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events["foo"] = [
        { ...eventState, submitted: false },
        { ...eventState, type: "add_to_cart", submitted: false },
      ];

      fetchMock.mockResponse("{}");

      await analytics.flush();

      expect(analytics.events.foo[0].submitted).toBe(true);
      expect(analytics.events.foo[1].submitted).toBe(true);
      expect(saveSpy).toHaveBeenCalledTimes(2);
    });

    it("leaves events as not submitted if sendEvent fails and doesn't call save", async () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events["foo"] = [{ ...eventState, submitted: false }];

      sendEventSpy.mockRejectedValueOnce(new Error("didn't save"));

      await analytics.flush();

      expect(analytics.events.foo[0].submitted).toBe(false);
      expect(saveSpy).not.toHaveBeenCalled();
    });
  });

  describe("purge", () => {
    function subtractDays(timestamp: number, days: number) {
      return timestamp - days * 24 * 60 * 60 * 1000;
    }

    it("removes all submitted events older than 30 days and calls save", () => {
      const nowMinus31Days = subtractDays(Date.now(), 31);
      const nowMinus29Days = subtractDays(Date.now(), 29);
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );
      analytics.events = {
        foo: [
          {
            ...eventState,
            timestamp: nowMinus31Days,
          },
          {
            ...eventState,
            type: "add_to_cart",
            timestamp: nowMinus31Days,
            submitted: false,
          },
          {
            ...eventState,
            type: "purchase",
            timestamp: nowMinus29Days,
          },
        ],
        bar: [
          {
            ...eventState,
            type: "redirect",
            timestamp: nowMinus31Days,
          },
        ],
      };

      analytics.purge();

      expect(analytics.events).toEqual({
        foo: [
          {
            ...eventState,
            type: "add_to_cart",
            timestamp: nowMinus31Days,
            submitted: false,
          },
          {
            ...eventState,
            type: "purchase",
            timestamp: nowMinus29Days,
          },
        ],
      });
      expect(saveSpy).toHaveBeenCalled();
    });

    it("doesn't call save when there is nothing to remove", () => {
      const analytics = new SearchIOAnalytics(
        "test_account",
        "test_collection"
      );

      analytics.purge();

      expect(saveSpy).not.toHaveBeenCalled();
    });
  });
});
