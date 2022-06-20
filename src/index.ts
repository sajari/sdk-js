import EventEmitter from "./events";
import { setItem, getItem } from "./util";
import { RequestError } from "./errors";
import {
  APIClient,
  KeySecretCredentials,
  QueryRequest,
  ActivePromotion,
  QueryResponse,
} from "./client";
export { EventEmitter, RequestError, setItem, getItem };
export { SearchIOAnalytics } from "./tracking";

/**
 * Client defines a client for interacting with the Sajari API.
 */
export class Client extends APIClient {
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
   * @param account
   * @param collection
   * @param {string} [endpoint]
   */
  constructor(
    account: string,
    collection: string,
    endpoint?: string,
    credentials?: KeySecretCredentials
  ) {
    super(account, collection, endpoint, credentials);
  }

  /**
   * pipeline creates a new QueryPipeline instance that inherits configuration from the Client.
   * @param name pipeline name
   * @param {string} [version] pipeline version
   */
  pipeline(name?: string, version?: string): QueryPipeline {
    return new QueryPipeline(this, name, version);
  }
}

/**
 * PipelineIdentifier is a name, version tuple that identifies a Query pipeline.
 */
export type PipelineIdentifier = Partial<{
  name: string;
  version: string;
}>;

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

  constructor(client: Client, name?: string, version?: string) {
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
    tracking?: QueryRequest["tracking"]
  ): Promise<[SearchResponse, Record<string, string>]> {
    this.emit(EVENT_SEARCH_SENT, values);
    const resp = await this.client.query({
      pipeline: this.identifier,
      variables: values,
      tracking,
    });

    const {
      results: searchResults,
      redirects,
      active_promotions: activePromotions,
      banners,
      query_id: queryId,
      aggregates,
      aggregate_filters: aggregateFilters,

      processing_time,
      total_size,
      variables,
      feature_score_weight: featureScoreWeight,
    } = resp;

    const activePins = formatActivePins(activePromotions);

    const results: Result[] = (searchResults || []).map(
      ({
        index_score: indexScore,
        score,
        record,
        neural_score: neuralScore,
        feature_score: featureScore,
      }) => {
        let promotionPinned = false;
        if (Object.keys(activePins).length > 0) {
          Object.entries(activePins).forEach(
            ([pinKeyFieldName, pinKeyFieldValues]) => {
              const fieldValue = record[pinKeyFieldName] as string;
              if (pinKeyFieldValues.has(fieldValue)) {
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
          values: record,
          promotionPinned,
        };
      }
    );

    return [
      {
        time: parseFloat(processing_time || "0.0"),
        totalResults: parseInt(total_size || "0", 10),
        banners,
        featureScoreWeight: featureScoreWeight || 0,
        results,
        aggregates: aggregates || {}, // formatAggregates(aggregates),
        aggregateFilters: aggregateFilters || {}, // formatAggregates(aggregateFilters),
        redirects: redirects || {},
        activePromotions: activePromotions ?? [],
        ...(queryId && { queryId }),
      },
      variables || {},
    ];
  }
}

function formatActivePins(
  activePromotions: ActivePromotion[] = []
): Record<string, Set<string>> {
  const pins: Record<string, Set<string>> = {};
  activePromotions.forEach(({ active_pins }) => {
    active_pins?.forEach(({ key }) => {
      if (!pins[key.field]) {
        pins[key.field] = new Set<string>();
      }
      pins[key.field].add(key.value);
    });
  });
  return pins;
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
  banners?: QueryResponse["banners"];

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
  aggregates: NonNullable<QueryResponse["aggregates"]>;

  /**
   * AggregateFilters computed on the query results (see [[Aggregates]]).
   */
  aggregateFilters: NonNullable<QueryResponse["aggregates"]>;

  /**
   * All Redirects for which the current query is a starting substring (see [[Redirects]]).
   */
  redirects: NonNullable<QueryResponse["redirects"]>;

  /**
   * All Promotions activated by the current query (see [[ActivePromotion]]).
   */
  activePromotions: NonNullable<QueryResponse["active_promotions"]>;

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
