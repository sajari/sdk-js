import { USER_AGENT } from "./user-agent";
import EventEmitter from "./events";
export { EventEmitter };

/**
 * NetworkError defines an error occuring from the network.
 */
export class NetworkError extends Error {
  type: "CONNECTION";

  constructor(message: string) {
    super(message);
    this.type = "CONNECTION";
  }
}

/**
 * RequestError defines an error occuring from a request.
 */
export class RequestError extends Error {
  statusCode: number;
  error?: Error;

  constructor(statusCode: number, message: string, error?: Error) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
  }
}

/**
 * Client defines a client for interacting with the Sajari API.
 */
export class Client {
  project: string;
  collection: string;
  endpoint: string;

  /**
   * Constructs an instance of Client for a specific project and collection.
   *
   * ```javascript
   * const client = new Client("<project>", "<collection>");
   * ```
   *
   * It is also possible to optionally set the api endpoint
   *
   * ```javascript
   * const client = new Client("<project>", "<collection>", "<endpoint>");
   * ```
   *
   * @param project
   * @param collection
   * @param {string} [endpoint]
   */
  constructor(
    project: string,
    collection: string,
    endpoint: string = "//jsonapi.sajari.net"
  ) {
    this.project = project;
    this.collection = collection;
    this.endpoint = endpoint;
  }

  /**
   * call executes a request to the Sajari API
   */
  async call<Response = any>(
    path: string,
    request: Record<string, any>,
    signal?: AbortSignal
  ): Promise<Response> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new NetworkError(
        "Search request failed due to a network error. Please check your network connection."
      );
    }

    const resp = await fetch(`${this.endpoint}${path}`, {
      signal,
      method: "POST",
      headers: {
        Accept: "application/json",
        // XXX: This is to remove the need for the OPTIONS request
        // https://stackoverflow.com/questions/29954037/why-is-an-options-request-sent-and-can-i-disable-it
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({
        metadata: {
          project: [this.project],
          collection: [this.collection],
          "user-agent": [USER_AGENT],
        },
        request,
      }),
    });

    if (resp.status !== 200) {
      let message = resp.statusText;
      try {
        let response = await resp.json();
        message = response.message;
      } catch (_) {}

      if (resp.status === 403) {
        throw new RequestError(
          resp.status,
          "This domain is not authorized to make this search request.",
          new Error(message)
        );
      }

      throw new RequestError(
        resp.status,
        "Search request failed due to a configuration error.",
        new Error(message)
      );
    }

    return await resp.json();
  }

  /**
   * pipeline creates a new QueryPipeline instance that inherits configuration from the Client.
   * @param name pipeline name
   * @param {string} [version] pipeline version
   */
  pipeline(name: string, version?: string): QueryPipeline {
    return new QueryPipeline(this, name, version);
  }

  /**
   * interactionConsume consumes an interaction token.
   */
  async interactionConsume(
    token: string,
    identifier: string,
    weight: number,
    data: Record<string, string> = {}
  ) {
    return this.call<void>("/sajari.interaction.v2.Interaction/ConsumeToken", {
      token,
      identifier,
      weight,
      data,
    });
  }
}

/**
 * Type of pipeline.
 */
export enum PipelineType {
  /**
   * Query pipeline.
   */
  Query = 1,
  /**
   * Record pipeline.
   */
  Record = 2,
}

export interface Step {
  identifier: string;
  title?: string;
  description?: string;

  parameters?: {
    [name: string]: {
      name?: string;
      defaultValue?: string;
    };
  };
  constants?: {
    [name: string]: {
      value?: string;
    };
  };

  condition?: string;
}

/**
 * Pipeline ...
 */
export interface Pipeline {
  identifier: PipelineIdentifier;
  created: Date;
  description?: string;
  steps: {
    preSteps: Step[];
    postSteps: Step[];
  };
}

/**
 * PipelineIdentifier ...
 */
export interface PipelineIdentifier {
  name: string;
  version?: string;
}

export const EVENT_SEARCH_SENT = "search-sent";

/**
 * QueryPipeline is a client for running query pipelines on a collection.  See
 * [[QueryPipeline.search]] for more details.
 *
 * Create a new QueryPipeline via [[Client.pipeline]].
 *
 * ```javascript
 * // const client = new Client(...);
 * const pipeline = client.pipeline("website");
 * ```
 */
class QueryPipeline extends EventEmitter {
  private client: Client;
  readonly identifier: PipelineIdentifier;

  constructor(client: Client, name: string, version?: string) {
    super();
    this.client = client;
    this.identifier = {
      name: name,
      version: version,
    };
  }

  /**
   * Search runs a search query defined by a pipeline with the given values and
   * session configuration.
   *
   * ```javascript
   * pipeline.search({ q: "<search query>" })
   *  .then(([response, values]) => {
   *    // handle response
   *  })
   *  .catch(error => {
   *    // handle error
   * })
   * ```
   *
   * @param values
   * @param tracking
   */
  async search(
    values: Record<string, string>,
    tracking?: Tracking
  ): Promise<[SearchResponse, Record<string, string>]> {
    let pt: TrackingProto = { type: TrackingType.None };
    if (tracking !== undefined) {
      const { queryID, ...rest } = tracking;
      pt = {
        query_id: queryID,
        ...rest,
      };
    }

    this.emit(EVENT_SEARCH_SENT, values);
    let jsonProto = await this.client.call<SearchResponseProto>(
      "/sajari.api.pipeline.v1.Query/Search",
      {
        pipeline: this.identifier,
        tracking: pt,
        values,
      }
    );

    const aggregates = Object.entries(
      jsonProto.searchResponse?.aggregates || {}
    )
      .map(([key, aggregate]) => {
        if ("metric" in aggregate) {
          let [t, k] = key.split(".");
          return {
            type: t,
            key: k,
            value: aggregate.metric.value,
          };
        }
        if ("count" in aggregate) {
          return {
            type: "count",
            key: key.replace(/^count./, ""),
            value: aggregate.count.counts,
          };
        }
        if ("buckets" in aggregate) {
          return {
            type: "count",
            key: "buckets",
            value: Object.values(aggregate.buckets?.buckets ?? {}).reduce(
              (obj, { name, count }) =>
                Object.assign(obj, {
                  [name]: count,
                }),
              {}
            ),
          };
        }
        return { key, value: aggregate };
      })
      .reduce<Aggregates>((obj, item) => {
        if (item.type === undefined) {
          console.debug(item);
          return obj;
        }

        if (obj[item.key] === undefined) {
          obj[item.key] = {};
        }
        // @ts-ignore
        obj[item.key][item.type] = item.value;

        return obj;
      }, {});

    const aggregateFilters = Object.entries(
      jsonProto.searchResponse?.aggregateFilters || {}
    )
      .map(([key, aggregate]) => {
        if ("metric" in aggregate) {
          let [t, k] = key.split(".");
          return {
            type: t,
            key: k,
            value: aggregate.metric.value,
          };
        }
        if ("count" in aggregate) {
          return {
            type: "count",
            key: key.replace(/^count./, ""),
            value: aggregate.count.counts,
          };
        }
        if ("buckets" in aggregate) {
          return {
            type: "count",
            key: "buckets",
            value: Object.values(aggregate.buckets?.buckets ?? {}).reduce(
              (obj, { name, count }) =>
                Object.assign(obj, {
                  [name]: count,
                }),
              {}
            ),
          };
        }
        return { key, value: aggregate };
      })
      .reduce<Aggregates>((obj, item) => {
        if (item.type === undefined) {
          console.debug(item);
          return obj;
        }

        if (obj[item.key] === undefined) {
          obj[item.key] = {};
        }
        // @ts-ignore
        obj[item.key][item.type] = item.value;

        return obj;
      }, {});

    const results: Result[] = (jsonProto.searchResponse?.results || []).map(
      ({ indexScore, score, values }, index) => {
        let t: Token | undefined = undefined;
        const token = (jsonProto.tokens || [])[index];
        if (token !== undefined) {
          if ("click" in token) {
            t = { click: clickTokenURL + token.click.token };
          } else if ("pos" in token) {
            t = { ...token };
          } else if ("posNeg" in token) {
            t = {
              pos: token.posNeg.pos,
              neg: token.posNeg.neg,
            };
          }
        }

        return {
          indexScore,
          score,
          values: processProtoValues(values),
          token: t,
        };
      }
    );

    return [
      {
        time: parseFloat(jsonProto.searchResponse?.time || "0.0"),
        totalResults: parseInt(
          jsonProto.searchResponse?.totalResults || "0",
          10
        ),
        results: results,
        aggregates: aggregates,
        aggregateFilters: aggregateFilters,
      },
      jsonProto.values || {},
    ];
  }
}

/**
 * Redirect URL for click tracking.  Prepended to the the front of the token
 * returned by the engine.
 * @hidden
 */
const clickTokenURL = "https://www.sajari.com/token/";

export interface SearchResponse {
  /**
   * Time in seconds taken to perform the query.
   */
  time: number;

  /**
   * totalResults is the total number of results.
   */
  totalResults: number;

  /**
   * Results of the query.
   */
  results: Result[];

  /**
   * Aggregates computed on the query results (see [[Aggregates]]).
   */
  aggregates: Aggregates;

  /**
   * AggregateFilters computed on the query results (see [[Aggregates]]).
   */
  aggregateFilters: Aggregates;
}

export interface Result {
  /**
   * indexScore is the index-matched score of this Result.
   */
  indexScore: number;
  /**
   * score is the overall score of this [[Result]].
   */
  score: number;
  /**
   * values is an object of field-value pairs.
   */
  values: Record<string, string | string[]>;
  /**
   * token is the [[Token]] associated with this [[Result]] (if any).
   */
  token?: Token;
}

export type Token = ClickToken | PosNegToken;

/**
 * ClickToken defines a click token.  See [[TrackingType.Click]] for more details.
 */
export type ClickToken = { click: string };

/**
 * PosNegToken defines a pos/neg token pair. See [[TrackingType.PosNeg]] for more details.
 */
export type PosNegToken = { pos: string; neg: string };

export type Aggregates = Record<
  string,
  Record<string, CountAggregate | MetricAggregate>
>;

export interface CountAggregate {
  count: Record<string, number>;
}

export type MetricAggregate = number;

/**
 * @hidden
 */
interface SearchResponseProto {
  searchResponse?: Partial<{
    time: string;
    totalResults: string;
    results: ResultProto[];
    aggregates: AggregatesProto;
    aggregateFilters: AggregatesProto;
  }>;
  tokens?: TokenProto[];
  values?: Record<string, string>;
}

/**
 * @hidden
 */
type TokenProto =
  | undefined
  | {
      click: { token: string };
    }
  | {
      pos: string;
      neg: string;
    }
  | {
      posNeg: {
        pos: string;
        neg: string;
      };
    };

/**
 * @hidden
 */
type ValueProto =
  | { single: string }
  | { repeated: { values: string[] } }
  | { null: boolean };

/**
 * @hidden
 */
function processProtoValues(values: Record<string, ValueProto>) {
  let vs: Record<string, string | string[]> = {};
  Object.keys(values).forEach((key) => {
    let v = valueFromProto(values[key]);
    if (v !== null) {
      vs[key] = v;
    }
  });
  return vs;
}

/**
 * @hidden
 */
function valueFromProto(value: ValueProto): string | string[] | null {
  if ("single" in value) {
    return value.single;
  } else if ("repeated" in value) {
    return value.repeated.values;
  }
  return null;
}

/**
 * @hidden
 */
interface ResultProto {
  indexScore: number;
  score: number;
  values: Record<string, ValueProto>;
}

/**
 * @hidden
 */
type AggregatesProto = Record<
  string,
  CountAggregateProto | MetricAggregateProto | BucketAggregateProto
>;

/**
 * @hidden
 */
interface CountAggregateProto {
  count: {
    counts: Record<string, number>;
  };
}

/**
 * @hidden
 */
interface BucketAggregateProto {
  buckets?: {
    buckets?: Record<
      string,
      {
        name: string;
        count: number;
      }
    >;
  };
}

/**
 * @hidden
 */
interface MetricAggregateProto {
  metric: {
    value: number;
  };
}

/**
 * Tracking defines behaviour for handling search sessions and result interactions.
 */
export type Tracking = {
  type: TrackingType;
  queryID?: string;
  sequence?: number;
  field?: string;
  data?: Record<string, string>;
};

/**
 * @hidden
 */
interface TrackingProto {
  type: TrackingType;
  query_id?: string;
  sequence?: number;
  field?: string;
  data?: Record<string, string>;
}

/**
 * TrackingType defines the possible result-interaction tracking types used by [[Session]]
 */
export enum TrackingType {
  /**
   * None disables tracking.
   */
  None = "NONE",
  /**
   * Click generates click tracking tokens.
   */
  Click = "CLICK",
  /**
   * PosNeg creates pos/neg tracking tokens.
   */
  PosNeg = "POS_NEG",
}

/**
 * Session takes query values, maintains session state, and returns tracking data
 * to be sent with search requests.
 */
export interface Session {
  /**
   * next returns [[Tracking]] to be sent with search requests.
   * @param values
   */
  next(values?: Record<string, string>): Tracking;

  /**
   * reset sets the [[Session]] instance to its empty state.
   */
  reset(): void;
}

export const EVENT_TRACKING_RESET = "tracking-reset";

/**
 * DefaultSession holds state of a sequence of searches.
 */
export class DefaultSession extends EventEmitter implements Session {
  private queryID: string = "";
  private sequence: number = 0;

  private type: TrackingType;
  private field?: string;
  private data?: Record<string, string>;

  constructor(
    type: TrackingType,
    field?: string,
    data?: Record<string, string>
  ) {
    super();
    this.type = type;
    this.field = field;
    this.data = mergeTrackingData(data);
  }

  next(_?: Record<string, string>): Tracking {
    if (this.queryID === "") {
      this.queryID = newQueryID();
      this.sequence = 0;
    } else {
      this.sequence++;
    }

    return {
      type: this.type,
      queryID: this.queryID,
      sequence: this.sequence,
      field: this.field,
      data: this.data,
    };
  }

  reset() {
    this.emit(EVENT_TRACKING_RESET);
    this.queryID = "";
    this.sequence = 0;
  }
}

/**
 * mergeTrackingData combines the provided session data with the requesters
 * google analytics ID and/or Sajari ID if present in the documents cookie.
 *
 * Because this is meant to be used on the client side, when in SSR mode
 * it will always return empty object
 * @hidden
 */
function mergeTrackingData(data?: Record<string, string>) {
  if (typeof window === "undefined") {
    return {};
  }
  const cookieData = document.cookie
    .split(";")
    .filter((item) => item.includes("_ga") || item.includes("sjID"))
    .map((item) => item.split("="))
    .reduce((data, [key, val]) => {
      if (key === "_ga") {
        data["ga"] = val;
        return data;
      }
      data[key] = val;
      return data;
    }, {} as Record<string, string>);

  if (data === undefined) {
    return cookieData;
  }

  Object.entries(cookieData).forEach(([key, val]) => {
    data[key] = val;
  });

  return data;
}

/**
 * newQueryID constructs a new ID for a query.
 * @hidden
 */
function newQueryID(len: number = 16): string {
  let output = "";
  for (let i = 0; i < len; i++) {
    output += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 36)
    );
  }
  return output;
}

/**
 * InteractiveSession creates a session based on text searches and is recommended
 * for use in search-as-you-type style interfaces.
 *
 * It resets the session if the search query value:
 *
 * - Is `undefined`.
 * - First 3 characters have changed (i.e. from a direct replacement)
 * - Cleared after being non-empty (i.e. from a delete)
 */
export class InteractiveSession implements Session {
  private session: Session;
  private textParam: string;
  private lastQuery: string;

  constructor(textParam: string, session: Session) {
    this.textParam = textParam;
    this.session = session;
    this.lastQuery = "";
  }

  next(values: Record<string, string>): Tracking {
    const text = values[this.textParam];
    if (text === undefined) {
      this.reset();
      return this.session.next(values);
    }

    const shortendPreviousQuery = this.lastQuery.substr(
      0,
      Math.min(text.length, 3)
    );
    const firstThreeCharsChanged =
      text.substr(0, shortendPreviousQuery.length) !== shortendPreviousQuery;
    const queryCleared = this.lastQuery.length > 0 && text.length === 0;
    if (firstThreeCharsChanged || queryCleared) {
      this.reset();
    }
    this.lastQuery = text;

    return this.session.next(values);
  }

  reset() {
    this.session.reset();
  }
}

type FilterFunc = () => string;

export const EVENT_SELECTION_UPDATED = "selection-updated";
export const EVENT_OPTIONS_UPDATED = "options-updated";

export class Filter extends EventEmitter {
  private options: Record<string, string | FilterFunc>;
  private active: string[];
  private multi: boolean;
  private joinOp: "OR" | "AND";

  constructor(
    options: Record<string, string>,
    initial: string[] = [],
    multi = false,
    joinOp: "OR" | "AND" = "OR"
  ) {
    super();
    this.options = options;
    this.active = initial;
    this.multi = multi;
    this.joinOp = joinOp;
  }

  set(key: string, active = true) {
    if (this.multi) {
      if (active && this.active.indexOf(key) === -1) {
        this.active = this.active.concat(key);
      } else {
        this.active = this.active.filter((k) => k !== key);
      }
      this.emit(EVENT_SELECTION_UPDATED, [...this.active]);
      return;
    }

    if (active) {
      this.active = [key];
    } else {
      this.active = [];
    }
    this.emit(EVENT_SELECTION_UPDATED, [...this.active]);
  }

  isActive(key: string): boolean {
    return this.active.indexOf(key) !== -1;
  }

  get(): string[] {
    return [...this.active];
  }

  updateOptions(options: Record<string, string | FilterFunc | undefined>) {
    Object.keys(options).forEach((key) => {
      const value = options[key];
      if (value === undefined) {
        delete this.options[key];
        this.active = this.active.filter((k) => k !== key);
        return;
      }

      this.options[key] = value;
    });
    this.emit(EVENT_OPTIONS_UPDATED, { ...this.options });
  }

  getOptions(): Record<string, string | FilterFunc> {
    return { ...this.options };
  }

  filter(): string {
    const filters = this.active
      .map((key) => {
        let filter = this.options[key];
        if (typeof filter === "function") {
          filter = filter();
        }
        if (filter !== "") {
          filter = `(${filter})`;
        }
        return filter;
      })
      .filter(Boolean);

    switch (filters.length) {
      case 0:
        return "";

      case 1:
        return filters[0];

      default:
        return filters.join(` ${this.joinOp} `);
    }
  }
}

export type ValueFunc = () => string;
export type ValueType =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]
  | ValueFunc;

export const EVENT_VALUES_UPDATED = "values-changed";

export class Values extends EventEmitter {
  private internal: Record<string, ValueType>;

  constructor(initial: Record<string, ValueType> = {}) {
    super();
    this.internal = initial;
  }

  _internalUpdate(values: Record<string, ValueType | undefined>) {
    Object.keys(values).forEach((key) => {
      const value = values[key];
      if (value === undefined) {
        delete this.internal[key];
      } else {
        this.internal[key] = value;
      }
    });
  }

  update(values: Record<string, ValueType | undefined>) {
    this._internalUpdate(values);
    this.emit(
      EVENT_VALUES_UPDATED,
      values,
      (values: Record<string, ValueType | undefined>) =>
        this._internalUpdate(values)
    );
  }

  get(): Record<string, string> {
    const values: Record<string, string> = {};
    Object.entries(this.internal).forEach(([key, value]) => {
      if (typeof value === "function") {
        values[key] = value();
      } else if (Array.isArray(value)) {
        values[key] = value.join(",");
      } else {
        values[key] = "" + value;
      }
    });

    return values;
  }
}
