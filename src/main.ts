/**
 * @fileOverview Exports the Sajari javascript api.
 * @name main.ts
 * @author Sajari
 * @license MIT
 * @module sajari
 */

const UserAgent = "sdk-js-1.0.0";

export interface Tracking {
  // Tracking specifies which kind (if any) tokens should be generated and returned
  // with the query results.
  type: TrackingType;

  // QueryID is a unique identifier for a single search query.  In the
  // case of live querying this is defined to be multiple individual queries
  // (i.e. as a user types the query is re-run).
  query_id: string;

  // Sequence (i.e. sequential identifier) of this  in the context of a
  // sequence of queries.
  sequence: number;

  // Field is the field to be used for adding identifier information to
  // generated tokens (see TrackingType).
  field: string;

  // Data are values which will be recorded along with tracking data produced
  // for the request.
  data: Values;
}

export interface Values {
  [id: string]: string;
}

export interface ISession {
  next(values: Values): [Tracking | undefined, Error | undefined];
  reset(): void;
}

export const TrackingNone: string = "";
export const TrackingClick: string = "CLICK";
export const TrackingPosNeg: string = "POS_NEG";

export const enum TrackingType {
  TrackingNone = "",
  TrackingClick = "CLICK",
  TrackingPosNeg = "POS_NEG"
}

// randString constructs a random string of 16 characters.
const randString = (): string => {
  let queryID = "";
  for (let i = 0; i < 16; i++) {
    queryID += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 36)
    );
  }
  return queryID;
};

export class TextSession implements ISession {
  private queryLabel: string;
  private session: ISession;
  private lastQuery: string = "";

  public constructor(queryLabel: string, session: ISession) {
    this.queryLabel = queryLabel;
    this.session = session;
  }

  public next(values: Values): [Tracking | undefined, Error | undefined] {
    const text = values[this.queryLabel];
    if (text === undefined) {
      this.reset();
      return this.session.next(values);
    }

    const shortenedPrevQ = this.lastQuery.substr(0, Math.min(text.length, 3));
    const first3CharactersChanged = !(
      text.substr(0, shortenedPrevQ.length) === shortenedPrevQ
    );
    const queryCleared = this.lastQuery.length > 0 && text.length === 0;
    if (first3CharactersChanged || queryCleared) {
      this.reset();
    }
    this.lastQuery = text;

    return this.session.next(values);
  }

  public reset(): void {
    this.session.reset();
  }
}

export class Session implements ISession {
  private queryID: string = "";
  private sequence: number = 0;

  private trackingType: TrackingType;
  private field: string;
  private sessionData: Values;

  public constructor(trackingType: TrackingType, field: string, data: Values) {
    this.trackingType = trackingType;
    this.field = field;
    this.sessionData = data;
  }

  public next(): [Tracking | undefined, Error | undefined] {
    if (this.queryID === "") {
      this.queryID = randString();
      this.sequence = 0;
    } else {
      this.sequence++;
    }

    return [
      {
        type: this.trackingType,
        query_id: this.queryID,
        sequence: this.sequence,
        field: this.field,
        data: this.sessionData
      },
      undefined
    ];
  }

  public reset(): void {
    this.queryID = "";
    this.sequence = 0;
  }
}

export type Opt = (client: Client) => void;

export const withEndpoint = (endpoint: string) => (client: Client) => {
  client.endpoint = endpoint;
};

/**
 * Client
 */
export class Client {
  public project: string;
  public collection: string;
  public endpoint: string;

  public constructor(project: string, collection: string, ...opts: Opt[]) {
    this.project = project;
    this.collection = collection;
    this.endpoint = "https://jsonapi.sajari.net/";
    opts.forEach(opt => {
      opt(this);
    });
  }

  public pipeline(name: string): Pipeline {
    return new Pipeline(this, name);
  }
}

export interface ResultValues {
  [id: string]: any;
}

export interface TokenValues {
  [id: string]: any;
}

export interface Result {
  // Values are field values of records.
  values: ResultValues;

  // Tokens contains any tokens associated with this Result.
  tokens: TokenValues;

  // Score is the overall score of this Result.
  score: number;

  // IndexScore is the index-matched score of this Result.
  indexScore: number;
}

export interface CountResponse {
  [id: string]: number;
}

export interface BucketResponse {
  name: string;
  count: number;
}

export interface BucketsResponse {
  [id: string]: BucketResponse;
}

export interface AggregateResponse {
  [id: string]: CountResponse | BucketsResponse;
}

export interface Results {
  // Reads is the total number of index values read.
  reads: number;

  // TotalResults is the total number of results for the query.
  totalResults: number;

  // Time in seconds taken to perform the query.
  time: number;

  // Aggregates computed on the query results (see Aggregate).
  aggregates: AggregateResponse;

  // Results of the query.
  results: Result[];
}

/**
 * valueFromProto unpacks a proto value.
 */
const valueFromProto = (proto: any): any => {
  if (proto.single !== undefined) {
    return proto.single;
  }
  if (proto.repeated.values !== undefined) {
    return proto.repeated.values;
  }
  return null;
};

/**
 * newResult constructs a Result from a proto Result.
 */
const newResult = (resultJSON: any): Result => {
  const values: ResultValues = {};
  Object.keys(resultJSON.values).forEach(k => {
    values[k] = valueFromProto(resultJSON.values[k]);
  });
  return {
    values,
    tokens: {},
    score: parseFloat(resultJSON.score),
    indexScore: parseFloat(resultJSON.indexScore)
  };
};

const newAggregates = (aggregateJSON: any = {}): AggregateResponse =>
  Object.keys(aggregateJSON).reduce((prev: AggregateResponse, cur) => {
    const [aggregateType, field] = cur.split(".");
    if (aggregateType === "count") {
      prev[cur] = aggregateJSON[cur].count.counts;
    } else if (aggregateType === "bucket") {
      // todo(tbillington): implement!
    }
    return prev;
  }, {});

/**
 * newResults constructs a Results object from a search reponse and array of tokens.
 */
const newResults = (response: any, tokens: any = []): Results => {
  const results = (response.results || []).map((r: any, i: number) => {
    const result = newResult(r);
    if (tokens.length > 0) {
      const token = tokens[i];
      if (token.click !== undefined) {
        result.tokens = { click: token.click };
      } else if (token.posNeg !== undefined) {
        result.tokens = { pos: token.posNeg.pos, neg: token.posNeg.neg };
      }
    }
    return result;
  });
  return {
    reads: parseInt(response.reads) || 0, // sometimes reads is not returned
    totalResults: parseInt(response.totalResults),
    time: parseFloat(response.time),
    aggregates: newAggregates(response.aggregates),
    results
  };
};

export interface SJError {
  message: string;
  code?: number;
}

const makeError = (message: string, code?: number): SJError => ({
  message,
  code
});

export interface Key {
  field: string;
  value: any;
}

export type SearchCallback = (
  results?: Results,
  values?: Values,
  error?: SJError
) => void;

export type AddCallback = (key: Key, error: SJError) => void;

export interface SJRecord {
  [id: string]: any;
}

/**
 * makeRequest makes a XMLHttpRequest and handles network and parsing errors.
 */
const makeRequest = (
  address: string,
  body: any,
  callback: (response: any, error?: SJError) => void
): void => {
  const request = new XMLHttpRequest();
  request.open("POST", address, true);
  request.setRequestHeader("Accept", "application/json");
  request.onreadystatechange = () => {
    if (request.readyState !== 4) return;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(request.responseText);
    } catch (e) {
      callback(undefined, makeError("error parsing response"));
      return;
    }

    if (request.status === 200) {
      callback(parsedResponse, undefined);
      return;
    }

    callback(undefined, makeError(parsedResponse.message, request.status));
  };

  request.send(body);
};

/**
 * Pipeline is a client for performing searches and adds on a collection.
 */
export class Pipeline {
  private client: Client;
  private name: string;

  /**
   * Create a pipeline
   */
  public constructor(client: Client, name: string) {
    this.client = client;
    this.name = name;
  }

  /**
   * Search runs a search query defined by a pipline with the given values and
   * tracking configuration. Calls the callback with the query results and returned values (which could have
   * been modified in the pipeline).
   */
  public search(
    values: Values,
    session: ISession,
    callback: SearchCallback
  ): void {
    const [tracking, error] = session.next(values);
    if (error) {
      callback(
        undefined,
        undefined,
        makeError("error getting next session: " + error)
      );
      return;
    }

    const requestBody = JSON.stringify({
      request: {
        pipeline: { name: this.name },
        tracking,
        values
      },
      metadata: {
        project: [this.client.project],
        collection: [this.client.collection],
        "user-agent": [UserAgent]
      }
    });

    makeRequest(
      this.client.endpoint + "sajari.api.pipeline.v1.Query/Search",
      requestBody,
      (response?: any, error?: SJError) => {
        const results = newResults(response.searchResponse, response.tokens);
        callback(results, response.values, undefined);
      }
    );
  }
}
