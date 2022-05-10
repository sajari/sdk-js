import { isSSR } from "./ssr";
import { APIError, NetworkError, RequestError } from "./error";

export class Client {
  private readonly account: string;
  private readonly collection: string;
  private readonly endpoint: string;

  constructor(
    account: string,
    collection: string,
    endpoint: string = "api.search.io"
  ) {
    this.account = account;
    this.collection = collection;
    this.endpoint = endpoint;
  }

  private createRequest(verb: "query" | "trackEvent") {
    return new Request(
      `https://${this.endpoint}/v4/collections/${this.collection}:${verb}`,
      {
        method: "POST",
        headers: {
          "Account-Id": this.account,
          Accept: "application/json",
          "Content-Type": "text/plain",
        },
      }
    );
  }

  async query(req: QueryRequest): Promise<QueryResponse> {
    hasNetworkConnection();

    const request = this.createRequest("query");
    const resp = await fetch(request, {
      body: JSON.stringify(req),
    });

    if (resp.status !== 200) {
      await handleErrorResponse(resp);
    }

    return await resp.json();
  }

  async trackEvent(req: TrackEventRequest) {
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
      "Search request failed due to a network error. Please check your network connection."
    );
  }
}

async function handleErrorResponse(resp: Response) {
  console.log(resp.statusText);

  const { message, code, details } = (await resp.json()) as {
    code: number;
    message: string;
    details?: any[];
  };

  let errMessage = "Search request failed due to an error.";

  // 16 = Unauthenticated
  // 7 = PermissionDenied
  if (code === 16 || code === 7) {
    console.error(
      `Check the domain ${window.location.hostname} is an authorized query domain. See https://app.search.io/collection/domains`
    );

    errMessage = "Search request failed due to a permission denied error.";
  } else {
    console.error(`Search request failed due to an error.`, {
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
  tracking:
    | { type: "NONE" }
    | { type: "EVENT"; field: string; data?: Record<string, string> };
};

export type QueryResponse = {
  pipeline: { name: string; version: string };
  variables: Record<string, string>;
  query_id: string;
  results: Result[];
  banners: Banner[];
  active_promotions: ActivePromotion[];
  redirects: Record<string, Redirect>;
  aggregates: Record<string, Aggregate>;
  aggregate_filters: Record<string, Aggregate>;
};

export type Result = {
  score: number;
  record: Record<string, string | string[]>;
};

export type ActivePromotion = {
  promotion_id: string;
  active_pins: PromotionPin[];
  active_exclusions: PromotionExclusion[];
};

export type PromotionPin = {
  key: { field: string; value: string };
  mode: "PIN" | "PROMOTE";
  position: number;
};

export type PromotionExclusion = {
  key: { field: string; value: string };
};

export type Banner = {
  id: string;
  title?: string;
  description?: string;
  position: number;
  width: number;
  height: number;
  target_url: string;
  image_url: string;
  text_color: string;
  text_position:
    | "TEXT_POSITION_UNSPECIFIED"
    | "TEXT_POSITION_CENTER"
    | "TEXT_POSITION_TOP_LEFT"
    | "TEXT_POSITION_TOP_RIGHT"
    | "TEXT_POSITION_BOTTOM_LEFT"
    | "TEXT_POSITION_BOTTOM_RIGHT";
};

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
      type: "click" | "view_item" | "add_to_cart" | "purchase";
      result_id: string;
      query_id: string;
      metadata?: Record<string, any>;
    };
