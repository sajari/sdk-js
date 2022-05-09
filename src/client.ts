class Client {
  private readonly account: string;
  private readonly collection: string;

  constructor(account: string, collection: string) {
    this.account = account;
    this.collection = collection;
  }

  private createRequest(verb: "query" | "trackEvent") {
    return new Request(
      `https://api.search.io/v4/collections/${this.collection}:${verb}`,
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
    const request = this.createRequest("query");
    const resp = await fetch(request, {
      body: JSON.stringify(req),
    });

    if (resp.status !== 200) {
      const { message, code, details } = await resp.json();
      throw new APIError(message, code, details);
    }

    return await resp.json();
  }

  async trackEvent(req: TrackEventRequest) {
    const request = this.createRequest("trackEvent");
    const resp = await fetch(request, {
      body: JSON.stringify(req),
    });

    if (resp.status !== 200) {
      const { message, code, details } = await resp.json();
      throw new APIError(message, code, details);
    }
  }
}

type TrackEventRequest =
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

class APIError extends Error {
  readonly code: number;
  readonly details?: { type_url: string; value: any }[];

  constructor(
    message: string,
    code: number,
    details?: { type_url: string; value: any }[]
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

type QueryRequest = {
  pipeline?: { name?: string; version?: string };
  variables: Record<string, string>;
  tracking:
    | { type: "NONE" }
    | { type: "EVENT"; field: string; data?: Record<string, string> };
};

type QueryResponse = {
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

type Result = {
  score: number;
  record: Record<string, string | string[]>;
};

type ActivePromotion = {
  promotion_id: string;
  active_pins: PromotionPin[];
  active_exclusions: PromotionExclusion[];
};

type PromotionPin = {
  key: { field: string; value: string };
  mode: "PIN" | "PROMOTE";
  position: number;
};

type PromotionExclusion = {
  key: { field: string; value: string };
};

type Banner = {
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

type Redirect = {
  id: string;
  target: string;
};

type Aggregate =
  | { metric: { value: number } }
  | { count: { counts: Record<string, number> } }
  | { buckets: { buckets: Record<string, { name: string; count: number }> } }
  | { date: { dates: Record<string, number> } };
