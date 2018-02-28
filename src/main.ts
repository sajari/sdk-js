/**
 * @fileOverview Exports the Sajari javascript api.
 * @name sajari.js
 * @author Sajari
 * @license MIT
 * @module sajari
 */
// import profile from "sajari-website/src/js/profile";

export const userAgent = "sdk-js-0.20.0";

const makeError = (message: string, code?: number) => ({
  message,
  code
});

const makeRequest = (address: string, body: any, callback: any) => {
  const request = new XMLHttpRequest();
  request.open("POST", address, true);
  request.setRequestHeader("Accept", "application/json");
  request.onreadystatechange = () => {
    if (request.readyState !== 4) return;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(request.responseText);
    } catch (e) {
      const error = makeError("error parsing response");
      callback(error, null);
      return;
    }

    if (request.status === 200) {
      callback(null, parsedResponse);
      return;
    }

    const error = makeError(parsedResponse.message, request.status);
    callback(error, null);
  };
  request.send(body);
  return request;
};

const makeSearchResponse = (json: any) => {
  // Flatten single value / multiple values proto structure
  const r = (json.searchResponse || {}).results;
  if (r) {
    for (let i = 0; i < r.length; i++) {
      for (let f in r[i].values) {
        r[i].values[f] =
          r[i].values[f].single !== undefined
            ? r[i].values[f].single
            : r[i].values[f].repeated.values;
      }
      // Copy tokens into results
      if (json.tokens) {
        r[i].tokens = json.tokens[i];
      }
    }
  } else {
    // Set default proto values for empty response
    json.searchResponse = {
      results: [],
      time: (json.searchResponse || {}).time,
      totalResults: "0",
      reads: "0"
    };
  }
  return json;
};

/** Class representing an instance of the Client. Handles the searching of queries and keeping track of query id and sequence */
export class Client {
  p: string;
  c: string;
  e: string;
  /**
   * Creates an Client object.
   * @constructor
   * @param {string} project The project name.
   * @param {string} collection The collection name.
   * @param {string} [endpoint] A custom endpoint to send requests.
   * @returns {Client} Client object.
   */
  constructor(project: string, collection: string, endpoint: string = "https://jsonapi.sajari.net") {
    /** @private */
    this.p = project;

    /** @private */
    this.c = collection;

    /** @private */
    this.e = endpoint;
  }

  /**
   * Performs a search
   * @param {Query} query The query object to perform a search with.
   * @param {Tracking} tracking The tracking config for the search.
   * @param {function(err: string, res: Object)} callback The callback to call when a response is received.
   * @returns {XMLHttpRequest}
   */
  search(query: any, tracking: any, callback: any) {
    const requestBody = JSON.stringify({
      request: {
        searchRequest: query.q,
        // eslint-disable-next-line no-param-reassign
        tracking: {
          type: tracking.type,
          field: tracking.field,
          sequence: tracking.s++, // Increment query sequence
          query_id: tracking.i,
          data: tracking.data
        }
      },
      metadata: {
        project: [this.p],
        collection: [this.c],
        "user-agent": [userAgent]
      }
    });

    return makeRequest(
      this.e + "/sajari.api.query.v1.Query/Search",
      requestBody,
      (err: any, response: any) => {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, makeSearchResponse(response));
      }
    );
  }

  /**
   * Performs a search using a pipeline.
   * @param {string} name The name of the pipeline to search with.
   * @param {Object} values Value map for the pipeline.
   * @param {Tracking} tracking The tracking config for the search.
   * @param {function(err: string, res: Object)} callback The callback to call when a response is received.
   * @returns {XMLHttpRequest}
   */
  searchPipeline(name: string, values: any, tracking: any, callback: any) {
    const stringifiedValues: any = {};
    Object.keys(values).forEach(k => {
      stringifiedValues[k] = String(values[k]);
    });

    const requestBody = JSON.stringify({
      request: {
        pipeline: { name },
        // eslint-disable-next-line no-param-reassign
        tracking: {
          type: tracking.type,
          field: tracking.field,
          sequence: tracking.s++, // Increment query sequence
          query_id: tracking.i,
          data: tracking.data
        },
        values: stringifiedValues
      },
      metadata: {
        project: [this.p],
        collection: [this.c],
        "user-agent": [userAgent]
      }
    });

    return makeRequest(
      this.e + "/sajari.api.pipeline.v1.Query/Search",
      requestBody,
      (err: any, response: any) => {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, makeSearchResponse(response));
      }
    );
  }
}

export const clickTracking = "CLICK";
export const posNeg = "POS_NEG";

export class Tracking {
  type: string|undefined;
  field: string|undefined;
  i: string = "";
  s: number = 0;
  /**
   * Create a new Tracking object.
   * @param {string|undefined} [type=undefined] Type of tracking to be used.
   * @param {string|undefined} [field=undefined] Unique field to use for tracking.
   */
  constructor(type = undefined, field = undefined) {
    /** @private */
    this.type = type;
    /** @private */
    this.field = field;

    this.reset();

    /** @private */
    // this.data = {}; // tracking data

    // const p = new profile();
    // const gaID = p.gaId;
    // if (gaID) {
    //   this.setData("gaID", gaID);
    // }
    // const visitorID = p.visitorId;
    // if (visitorID) {
    //   this.setData("sjID", visitorID);
    // }
  }

  /**
   * Resets tracking ID on the Query object.
   */
  reset() {
    /** @private */
    this.i = "";
    /** @private */
    this.s = 0;

    // Generate a random id for the query
    for (let i = 0; i < 16; i++) {
      this.i += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
        Math.floor(Math.random() * 36)
      );
    }
  }

  /**
   * Set tracking data in a key value stre to be sent with the Query.
   * @param {string} name The name of the custom tracking data
   * @param {string} value The value of the custom tracking data
   */
  setData(name: string, value: string) {
    // this.data[name] = value;
  }
}
