import { isSSR } from "./ssr";
import { APIError, NetworkError, RequestError } from "./errors";
import { USER_AGENT } from "./user-agent";

export type KeySecretCredentials = { key: string; secret: string };

/**
 * APIClient defines a client for interacting with the Search.io API.
 */
export class APIClient {
  private readonly account: string;
  private readonly collection: string;
  private readonly credentials?: KeySecretCredentials;
  private readonly endpoint: string;

  /**
   * Constructs an instance of Client for a specific account and collection.
   *
   * ```javascript
   * const client = new APIClient("<account_id>", "<collection_id>");
   * ```
   *
   * It is also possible to optionally set the API endpoint:
   *
   * ```javascript
   * const client = new APIClient("<account_id>", "<collection_id>", "<endpoint>");
   * ```
   *
   * @param account
   * @param collection
   * @param {string} [endpoint]
   */
  constructor(
    account: string,
    collection: string,
    endpoint: string = "api.search.io",
    credentials?: KeySecretCredentials
  ) {
    this.account = account;
    this.collection = collection;
    this.endpoint = endpoint;
    this.credentials = credentials;

    if (!isSSR() && this.credentials) {
      throw new Error(
        "Key/Secret credentials are only allowed in an SSR environment."
      );
    }
  }

  private createRequest(verb: "query" | "trackEvent") {
    const requestInit = {
      method: "POST",
      headers: new Headers({
        "Account-Id": this.account,
        Accept: "application/json",
        "Content-Type": "text/plain",
        "Grpc-Metadata-UserAgent": USER_AGENT,
      }),
    };

    if (isSSR() && this.credentials) {
      requestInit.headers.set(
        "Authorization",
        "Basic " +
          Buffer.from(
            this.credentials.key + ":" + this.credentials.secret
          ).toString("base64")
      );
    }

    return new Request(
      `https://${this.endpoint}/v4/collections/${this.collection}:${verb}`,
      requestInit
    );
  }

  /**
   * Query runs a search query.
   *
   * ```javascript
   * client.query({ variables: { q: "<search query>" } })
   *  .then((response) => {
   *    // handle response
   *  })
   *  .catch(error => {
   *    // handle error
   * })
   * ```
   *
   * @param req
   */
  async query(req: QueryRequest): Promise<QueryResponse> {
    hasNetworkConnection();

    if (!req.tracking) {
      req.tracking = { type: "NONE" };
    }

    const request = this.createRequest("query");
    const resp = await fetch(request, {
      body: JSON.stringify(req),
    });

    if (resp.status !== 200) {
      await handleErrorResponse(resp);
    }

    return await resp.json();
  }

  protected async trackEvent(req: TrackEventRequest) {
    hasNetworkConnection();

    const request = this.createRequest("trackEvent");
    const resp = await fetch(request, {
      method: "POST",
      body: JSON.stringify(req),
    });

    if (resp.status !== 200) {
      await handleErrorResponse(resp);
    }
  }
}

// Check we have a connection in non SSR context
function hasNetworkConnection() {
  if (!isSSR() && !navigator.onLine) {
    throw new NetworkError(
      "Request failed due to a network error. Please check your network connection."
    );
  }
}

async function handleErrorResponse(resp: Response) {
  const { message, code, details } = (await resp.json()) as {
    code: number;
    message: string;
    details?: any[];
  };

  let errMessage = "Request failed due to an error.";

  // 16 = Unauthenticated
  // 7 = PermissionDenied
  if (code === 16 || code === 7) {
    console.error(
      `Check the domain ${window.location.hostname} is an authorized domain. See https://app.search.io/collection/domains`
    );

    errMessage = "This domain is not authorized to make this request.";
  } else {
    console.error(`Request failed due to an error.`, {
      httpStatusCode: resp.status,
      gRPCStatusCode: code,
      message: message,
    });
  }

  throw new RequestError(
    resp.status,
    errMessage,
    new APIError(message, code, details)
  );
}

export type QueryRequest = {
  pipeline?: { name?: string; version?: string };
  variables: Record<string, string>;
  tracking?:
    | { type: "NONE" }
    | { type: "EVENT"; field: string; data?: Record<string, string> };
};

export type QueryResponse = {
  pipeline: { name: string; version: string };
  variables?: Record<string, string>;
  /**
   * Id of the query.
   */
  query_id?: string;
  /**
   * The total time taken to perform the query.
   */
  processing_time: string;
  /**
   * The total number of results that match the query.
   */
  total_size: string;
  /**
   * The weight applied to the features in the query, used for analyzing
   * the index, neural and feature components for results
   */
  feature_score_weight?: number;
  /**
   * Results of the query.
   */
  results?: Result[];
  /**
   * Banners are synthetic search result that renders as an image. It takes a user to a
   * pre-determined location when clicked.
   */
  banners?: Banner[];
  /**
   * All Promotions activated by the current query (see [[ActivePromotion]]).
   */
  active_promotions?: ActivePromotion[];
  /**
   * All redirects which match the current query substring are returned. An autocomplete query where `q` is "foo"
   * could result in a redirects collection containing `{"foobar": {…}, "foo qux": {…}}` being returned.
   * See [[Redirect]] for shape of target object.
   */
  redirects?: Record<string, Redirect>;
  /**
   * Aggregates computed on the query results (see [[Aggregates]]).
   */
  aggregates?: Record<string, Aggregate>;
  /**
   * AggregateFilters computed on the query results (see [[Aggregates]]).
   */
  aggregate_filters?: Record<string, Aggregate>;
};

export type Result = {
  /**
   * score is the overall score of this [[Result]].
   */
  score: number;
  /**
   * index_score is the index-matched score of this [[Result]].
   */
  index_score: number;
  /**
   * neural_score is the neural score of this [[Result]].
   */
  neural_score?: number;
  /**
   * relevance_score is ... [[Result]].
   */
  relevance_score?: number;
  /**
   * feature_score is the feature based search score of this [[Result]].
   */
  feature_score?: number;

  /**
   * record is an object of field-value pairs.
   */
  record: Record<string, string | string[]>;
};

/**
 * A Promotion adjusts search results via a set of rules configured by the client.
 * All promotions which are triggered by the current search are returned.
 */
export type ActivePromotion = {
  promotion_id: string;
  active_pins: PromotionPin[];
  active_exclusions: PromotionExclusion[];
};

/**
 * PromotionPin defines a promotion pin.
 */
export type PromotionPin = {
  key: { field: string; value: string };
  mode?: "PIN" | "PROMOTE";
  position: number;
};

/**
 * PromotionExclusion defines a promotion exclusion.
 */
export type PromotionExclusion = {
  key: { field: string; value: string };
};

export type Banner = {
  /**
   * The ID of the banner, used to identify clicked banners.
   * @type {string}
   * @memberof Banner
   */
  id: string;
  /**
   * The title of the banner, displayed in header font.
   * @type {string}
   * @memberof Banner
   */
  title?: string;
  /**
   * The description of the banner, displayed in sub-head font.
   * @type {string}
   * @memberof Banner
   */
  description?: string;
  /**
   * The 1-based index indicating where the banner appears in search results.
   * @type {number}
   * @memberof Banner
   */
  position: number;
  /**
   * The width the banner occupies in grid cells.
   * @type {number}
   * @memberof Banner
   */
  width: number;
  /**
   * The ID of the banner, used to identify clicked banners.
   * @type {string}
   * @memberof Banner
   */
  height: number;
  /**
   * The color of the text as a hex code with a # prefix, e.g. #FFCC00 or #FC0.
   * @type {string}
   * @memberof Banner
   */
  target_url: string;
  /**
   * The URL of the image used for the banner.
   * @type {string}
   * @memberof Banner
   */
  image_url: string;
  /**
   * The color of the text as a hex code with a # prefix, e.g. #FFCC00 or #FC0.
   * @type {string}
   * @memberof Banner
   */
  text_color?: string;
  /**
   * text_position describes the position of text in a box.
   *
   *  - TEXT_POSITION_UNSPECIFIED: No position specified.
   *  - TEXT_POSITION_CENTER: The text is positioned in the horizontal and vertical center.
   *  - TEXT_POSITION_TOP_LEFT: The text is positioned in the top left corner.
   *  - TEXT_POSITION_TOP_RIGHT: The text is positioned in the top right corner.
   *  - TEXT_POSITION_BOTTOM_LEFT: The text is positioned in the bottom left corner.
   *  - TEXT_POSITION_BOTTOM_RIGHT: The text is positioned in the bottom right corner.
   * @memberof Banner
   */
  text_position?:
    | "TEXT_POSITION_UNSPECIFIED"
    | "TEXT_POSITION_CENTER"
    | "TEXT_POSITION_TOP_LEFT"
    | "TEXT_POSITION_TOP_RIGHT"
    | "TEXT_POSITION_BOTTOM_LEFT"
    | "TEXT_POSITION_BOTTOM_RIGHT";
};

/**
 * A Redirect defines a search string which clients should handle by sending users to a specific location
 * instead of a standard search results screen. In a default setup, these are only returned by an autocomplete
 * pipeline. Web search clients handle redirects by sending the web browser to the `target` URL.
 * Other clients (mobile) may handle redirect forwarding differently.
 * See [[QueryResponse.redirects]] for redirect collection details.
 */
export type Redirect = {
  id: string;
  target: string;
};

export type Aggregate =
  | { metric: { value: number } }
  | { count: { counts: Record<string, number> } }
  | { buckets: { buckets: Record<string, { name: string; count: number }> } }
  | { date: { dates: Record<string, number> } };

export type TrackEventRequest =
  | {
      type: "redirect";
      redirect_id: string;
      query_id: string;
      metadata?: Record<string, any>;
    }
  | {
      type: "promotion_click";
      banner_id: string;
      query_id: string;
      metadata?: Record<string, any>;
    }
  | {
      type: "click" | "view_item" | "add_to_cart" | "purchase" | string;
      result_id: string;
      query_id: string;
      metadata?: Record<string, any>;
    };
