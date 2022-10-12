import { USER_AGENT } from "./user-agent";
import EventEmitter from "./events";
import { isSSR } from "./ssr";
import { RequestError, setItem, getItem } from "./util";
export { EventEmitter, RequestError, setItem, getItem };
export { SearchIOAnalytics } from "./tracking";

interface APIError {
  code:
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15
    | 16;
  message: string;
}

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

type ConfigObj = {
  /**
   * Redirect URL for click tracking.  Prepended to the the front of the token
   * returned by the engine.
   * @deprecated See [[SearchIOAnalytics]] for new tracking APIs.
   */
  clickTokenURL: string;
  /**
   * Callers can set this to add an additional user agent value to the request's metadata.
   */
  userAgent: string;
};

const configDefaults: ConfigObj = {
  clickTokenURL: "https://re.sajari.com/token/",
  userAgent: "",
};

/**
 * Client defines a client for interacting with the Sajari API.
 */
export class Client {
  // The account ID (formerly called project).
  project: string;
  // The collection ID.
  collection: string;
  endpoint: string;
  key?: string;
  secret?: string;
  config: ConfigObj;
  userAgent: string = "";

  /**
   * Constructs an instance of Client for a specific account and collection.
   *
   * ```javascript
   * const client = new Client("<account_id>", "<collection_id>");
   * ```
   *
   * It is also possible to optionally set the API endpoint:
   *
   * ```javascript
   * const client = new Client("<account_id>", "<collection_id>", "<endpoint>");
   * ```
   *
   * @param project
   * @param collection
   * @param {string} [endpoint]
   */
  constructor(
    project: string,
    collection: string,
    endpoint: string = `${isSSR() ? "https:" : ""}//jsonapi.sajari.net`,
    key?: string,
    secret?: string,
    config?: Partial<ConfigObj>
  ) {
    // Key/secret is only allowed in non SSR context
    if (!isSSR() && [key, secret].some(Boolean)) {
      throw new Error(
        "key/secret authorization is only supported for server-side rendering."
      );
    }

    this.project = project;
    this.collection = collection;
    this.endpoint = endpoint;
    this.key = key;
    this.secret = secret;
    this.config = Object.assign(configDefaults, config);
    this.interactionConsume = this.interactionConsume.bind(this);
  }

  /**
   * call executes a request to the Sajari API
   */
  async call<Response = any>(
    path: string,
    request: Record<string, any>,
    signal?: AbortSignal
  ): Promise<Response> {
    // Check we have a connection in non SSR context
    if (!isSSR() && !navigator.onLine) {
      throw new NetworkError(
        "Search request failed due to a network error. Please check your network connection."
      );
    }

    const metadata = {
      project: [this.project],
      collection: [this.collection],
      "user-agent": [
        [USER_AGENT, this.userAgent, this.config.userAgent]
          .filter(Boolean)
          .join(" "),
      ],
    };

    // Only allow key/secret for SSR contexts
    if (isSSR() && [this.key, this.secret].every(Boolean)) {
      Object.assign(metadata, {
        authorization: [`keysecret ${this.key} ${this.secret}`],
      });
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
        metadata,
        request,
      }),
    });

    if (resp.status !== 200) {
      let code;
      let message = resp.statusText;
      try {
        ({ code, message } = (await resp.json()) as APIError);
      } catch (_) {}

      if (resp.status === 403) {
        console.error(
          `Check the domain ${window.location.hostname} is an authorized query domain. See https://app.search.io/collection/domains`
        );
        throw new RequestError(
          resp.status,
          `Search request failed due to a permission denied error.`,
          new Error(message)
        );
      }

      console.error(
        `Search request failed due to an error. HTTP code: ${resp.status}, Code: ${code}, Message: ${message}`
      );
      throw new RequestError(
        resp.status,
        `Search request failed due to an error.`,
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
   * On each result when using [[TrackingType.Click]] or [[TrackingType.PosNeg]], there is a set of tokens. These tokens allow you to provide feedback to the ranking system. When a user interacts with a result, you can send back the token with some extra information.
   *
   * The following example invocation of the consume function is noting that this particular interaction was a "purchase" and the user purchasing the item was 20 years old (this information comes from some system that you operate.)
   *
   * ```javascript
   * client.interactionConsume(token, "purchase", 1.0, {
   *   age: "20",
   * });
   * ```
   * @deprecated in favor of [[SearchIOAnalytics]] tracking APIs.
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
    const jsonProto = await this.client.call<SearchResponseProto>(
      "/sajari.api.pipeline.v1.Query/Search",
      {
        pipeline: this.identifier,
        tracking: pt,
        values,
      }
    );
    const {
      searchResponse,
      redirects,
      tokens,
      activePromotions,
      banners,
      queryId,
    } = jsonProto;

    const activePins = formatActivePins(activePromotions);

    const results: Result[] = (searchResponse?.results || []).map(
      ({ indexScore, score, values, neuralScore, featureScore }, index) => {
        let t: Token | undefined = undefined;
        const token = (tokens || [])[index];
        if (token !== undefined) {
          if ("click" in token) {
            t = { click: this.client.config.clickTokenURL + token.click.token };
          } else if ("pos" in token) {
            t = { ...token };
          } else if ("posNeg" in token) {
            t = {
              pos: token.posNeg.pos,
              neg: token.posNeg.neg,
            };
          }
        }

        let promotionPinned = false;
        if (Object.keys(activePins).length > 0) {
          Object.entries(activePins).forEach(
            ([pinKeyFieldName, pinKeyFieldValues]) => {
              const fieldValue =
                (values[pinKeyFieldName] &&
                  valueFromProto(values[pinKeyFieldName])) ??
                null;
              if (
                typeof fieldValue === "string" &&
                pinKeyFieldValues.has(fieldValue)
              ) {
                promotionPinned = true;
              }
            }
          );
        }

        return {
          indexScore,
          ...(neuralScore && { neuralScore }),
          ...(featureScore && { featureScore }),
          score,
          values: processProtoValues(values),
          token: t,
          promotionPinned,
        };
      }
    );

    return [
      {
        time: parseFloat(searchResponse?.time || "0.0"),
        totalResults: parseInt(searchResponse?.totalResults || "0", 10),
        banners,
        featureScoreWeight: searchResponse?.featureScoreWeight || 0,
        results,
        aggregates: formatAggregates(searchResponse?.aggregates),
        aggregateFilters: formatAggregates(searchResponse?.aggregateFilters),
        redirects: prependClickTokenUrl(
          this.client.config.clickTokenURL,
          redirects
        ),
        activePromotions: activePromotions ?? [],
        ...(queryId && { queryId }),
      },
      jsonProto.values || {},
    ];
  }
}

function formatActivePins(
  activePromotions: ActivePromotion[] = []
): Record<string, Set<string>> {
  const pins: Record<string, Set<string>> = {};
  activePromotions.forEach(({ activePins }) => {
    activePins?.forEach(({ key }) => {
      if (!pins[key.field]) {
        pins[key.field] = new Set<string>();
      }
      pins[key.field].add(key.value);
    });
  });
  return pins;
}

function prependClickTokenUrl(
  clickTokenURL: string,
  redirects: Redirects = {}
): Redirects {
  return Object.entries(redirects).reduce<Redirects>(
    (acc, [queryString, target]) => {
      acc[queryString] = target;
      acc[queryString]["token"] = clickTokenURL + acc[queryString]["token"];
      return acc;
    },
    {}
  );
}

export function formatAggregates(
  aggregatesProto: AggregatesProto = {}
): Aggregates {
  return Object.entries(aggregatesProto)
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

      let field = obj[item.key][item.type];
      if (
        item.type === "count" &&
        item.key === "buckets" &&
        typeof field === "object" &&
        typeof item.value === "object"
      ) {
        field = {
          // to prevent overwriting old value
          ...field,
          ...item.value,
        };
        obj[item.key][item.type] = field;
      } else {
        // @ts-ignore
        obj[item.key][item.type] = item.value;
      }

      return obj;
    }, {});
}

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
   * banners is synthetic search result that renders as an image. It takes a user to a
   * pre-determined location when clicked.
   */
  banners?: Banner[];

  /**
   * Feature score weight determines the weighting of featureScore vs neural and index scores.
   */
  featureScoreWeight: number;

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

  /**
   * All Redirects for which the current query is a starting substring (see [[Redirects]]).
   */
  redirects: Redirects;

  /**
   * All Promotions activated by the current query (see [[ActivePromotion]]).
   */
  activePromotions: ActivePromotion[];

  /**
   * Id of the query.
   */
  queryId?: string;
}

/**
 * TextPosition describes the position of text in a box.
 *
 *  - TEXT_POSITION_UNSPECIFIED: No position specified.
 *  - TEXT_POSITION_CENTER: The text is positioned in the horizontal and vertical center.
 *  - TEXT_POSITION_TOP_LEFT: The text is positioned in the top left corner.
 *  - TEXT_POSITION_TOP_RIGHT: The text is positioned in the top right corner.
 *  - TEXT_POSITION_BOTTOM_LEFT: The text is positioned in the bottom left corner.
 *  - TEXT_POSITION_BOTTOM_RIGHT: The text is positioned in the bottom right corner.
 * @export
 * @enum {string}
 */
export enum TextPosition {
  Unspecified = "TEXT_POSITION_UNSPECIFIED",
  Center = "TEXT_POSITION_CENTER",
  TopLeft = "TEXT_POSITION_TOP_LEFT",
  TopRight = "TEXT_POSITION_TOP_RIGHT",
  BottomLeft = "TEXT_POSITION_BOTTOM_LEFT",
  BottomRight = "TEXT_POSITION_BOTTOM_RIGHT",
}

export interface Banner {
  /**
   * The description of the banner, displayed in sub-head font.
   * @type {string}
   * @memberof Banner
   */
  description?: string;
  /**
   * The height the banner occupies in grid cells.
   * @type {number}
   * @memberof Banner
   */
  height?: number;
  /**
   * The ID of the banner, used to identify clicked banners.
   * @type {string}
   * @memberof Banner
   */
  id?: string;
  /**
   * The URL of the image used for the banner.
   * @type {string}
   * @memberof Banner
   */
  imageUrl?: string;
  /**
   * The 1-based index indicating where the banner appears in search results.
   * @type {number}
   * @memberof Banner
   */
  position?: number;
  /**
   * The URL to redirect the user to when the banner is clicked.
   * @type {string}
   * @memberof Banner
   */
  targetUrl?: string;
  /**
   * The color of the text as a hex code with a # prefix, e.g. #FFCC00 or #FC0.
   * @type {string}
   * @memberof Banner
   */
  textColor?: string;
  /**
   *
   * @type {TextPosition}
   * @memberof Banner
   */
  textPosition?: TextPosition;
  /**
   * The title of the banner, displayed in header font.
   * @type {string}
   * @memberof Banner
   */
  title?: string;
  /**
   * The width the banner occupies in grid cells.
   * @type {number}
   * @memberof Banner
   */
  width?: number;
}

export interface Result {
  /**
   * indexScore is the index-matched score of this [[Result]].
   */
  indexScore: number;
  /**
   * neuralScore is the neural score of this [[Result]].
   */
  neuralScore?: number;
  /**
   * featureScore is the feature based search score of this [[Result]].
   */
  featureScore?: number;
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
   * @deprecated the modern tracking API, [[SearchIOAnalytics]], does not require tracking tokens
   */
  token?: Token;
  /**
   * promotionPinned indicates whether this [[Result]] is pinned via an [[ActivePromotion]].
   */
  promotionPinned?: boolean;
}

/**
 * @deprecated the modern tracking API, [[SearchIOAnalytics]], does not require tracking tokens
 */
export type Token = ClickToken | PosNegToken;

/**
 * ClickToken defines a click token.  See [[TrackingType.Click]] for more details.
 * @deprecated the modern tracking API, [[SearchIOAnalytics]], does not require tracking tokens
 */
export type ClickToken = { click: string };

/**
 * PosNegToken defines a pos/neg token pair. See [[TrackingType.PosNeg]] for more details.
 * @deprecated the modern tracking API, [[SearchIOAnalytics]], does not require tracking tokens
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
 * A Redirect defines a search string which clients should handle by sending users to a specific location
 * instead of a standard search results screen. In a default setup, these are only returned by an autocomplete
 * pipeline. Web search clients handle redirects by sending the web browser to the `target` or `token` URL.
 * Other clients (mobile) may handle redirect forwarding differently.
 * See [[Redirects]] for redirect collection details.
 */
export interface RedirectTarget {
  id: string;
  target: string;
  token?: string;
}

/**
 * All redirects which match the current query substring are returned. An autocomplete query where `q` is "foo"
 * could result in a redirects collection containing `{"foobar": {…}, "foo qux": {…}}` being returned.
 * See [[RedirectTarget]] for shape of target object.
 */
export interface Redirects {
  [redirectQuery: string]: RedirectTarget;
}

/**
 * PromotionPin defines a promotion pin.
 */
export interface PromotionPin {
  key: {
    field: string;
    value: string;
  };
  position: number;
}

/**
 * PromotionExclusion defines a promotion exclusion.
 */
export interface PromotionExclusion {
  key: {
    field: string;
    value: string;
  };
}

/**
 * A Promotion adjusts search results via a set of rules configured by the client.
 * All promotions which are triggered by the current search are returned.
 */
export interface ActivePromotion {
  promotionId: string;
  activePins?: PromotionPin[];
  activeExclusions?: PromotionExclusion[];
}

/**
 * @hidden
 */
export interface SearchResponseProto {
  searchResponse?: Partial<{
    time: string;
    totalResults: string;
    featureScoreWeight?: number;
    results: ResultProto[];
    aggregates: AggregatesProto;
    aggregateFilters: AggregatesProto;
  }>;
  tokens?: TokenProto[];
  values?: Record<string, string>;
  banners?: Banner[];
  redirects?: Redirects;
  activePromotions?: ActivePromotion[];
  queryId?: string;
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
  | { singleBytes: string }
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
  } else if ("singleBytes" in value) {
    return value.singleBytes;
  }
  return null;
}

/**
 * @hidden
 */
interface ResultProto {
  indexScore: number;
  neuralScore?: number;
  featureScore?: number;
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
 * @deprecated See [[SearchIOAnalytics]] for new tracking APIs.
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
   * @deprecated Use EVENT for new tracking APIs
   */
  Click = "CLICK",
  /**
   * PosNeg creates pos/neg tracking tokens.
   * @deprecated Use EVENT for new tracking APIs
   */
  PosNeg = "POS_NEG",
  /**
   * Event uses simplified tracking.
   */
  Event = "EVENT",
}

/**
 * Session takes query values, maintains session state, and returns tracking data
 * to be sent with search requests.
 * @deprecated The modern tracking API ,[[SearchIOAnalytics]], does not tracking search 'sessions'
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
 * @deprecated Use [[SearchIOAnalytics]] which does not attempt to track search sequences in the client.
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
 * @deprecated  The new API, [[SearchIOAnalytics]], does not track search 'sessions' in the client.
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

/**
 * @deprecated  See [[SearchIOAnalytics]] for new tracking identifier information
 */
export type TokenState = {
  token: PosNegToken;
  clickSubmitted: boolean;
};

export const POS_NEG_STORAGE_KEY = "sajari_tokens";

/**
 * PosNegLocalStorageManager is a utility class for manipulating Sajari's localstorage based
 * management of PosNeg tokens. Typical use case is storing tokens for later consumption
 * as users move through an ecommerce purchase funnel.
 * @deprecated See [[SearchIOAnalytics]] for new tracking APIs.
 */
export class PosNegLocalStorageManager {
  currentTokens: Record<string | number, TokenState>;
  client: Client;
  constructor(client: Client) {
    const storageContent = getItem(POS_NEG_STORAGE_KEY);
    try {
      this.currentTokens = storageContent ? JSON.parse(storageContent) : {};
    } catch (e) {
      this.currentTokens = {};
      console.error(
        "Sajari PosNeg local storage key contains corrupt data.",
        storageContent
      );
    }
    this.client = client;
  }
  add(fieldValue: string | number, token: PosNegToken) {
    this.currentTokens[fieldValue] = { token, clickSubmitted: false };
    setItem(POS_NEG_STORAGE_KEY, JSON.stringify(this.currentTokens));
  }
  get(fieldValue: string | number): TokenState | undefined {
    return this.currentTokens[fieldValue];
  }
  sendPosEvent(
    fieldValue: string | number,
    identifier: string,
    weight: number
  ) {
    const tokenState = this.get(fieldValue);
    if (tokenState === undefined) {
      return;
    }
    this.client.interactionConsume(tokenState.token.pos, identifier, weight);
  }
  sendClickEvent(fieldValue: string | number) {
    const tokenState = this.get(fieldValue);
    if (tokenState === undefined || tokenState.clickSubmitted !== false) {
      return;
    }
    this.sendPosEvent(fieldValue, "click", 1);
    this.currentTokens[fieldValue].clickSubmitted = true;
    setItem(POS_NEG_STORAGE_KEY, JSON.stringify(this.currentTokens));
  }
  sendPendingClicks() {
    Object.keys(this.currentTokens).forEach((fieldValue) => {
      if (this.currentTokens[fieldValue].clickSubmitted === false) {
        this.sendClickEvent(fieldValue);
        this.currentTokens[fieldValue].clickSubmitted = true;
      }
    });
  }
}
