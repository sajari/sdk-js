/** PosNegToken defines a pos/neg token pair. See [[TrackingType.PosNeg]] for more details. */
export interface PosNegToken {
  pos: string;
  neg: string;
}

/** ClickToken defines a click token.  See [[TrackingType.Click]] for more details. */
export interface ClickToken {
  click: string;
}

export type Token = PosNegToken | ClickToken;

export interface Result {
  /** Values is an object of field-value pairs. */
  values: {
    [id: string]: string | string[];
  };

  /** Token is the token associated with this Result (if any). */
  token: Token;

  /** Score is the overall score of this Result. */
  score: number;

  /** IndexScore is the index-matched score of this Result. */
  indexScore: number;
}

/** CountResponse is a type returned from a query which has performed a count aggregate. */
export interface CountResponse {
  [id: string]: number;
}

export interface BucketResponse {
  /** Name of the bucket. */
  name: string;

  /** Number of records in the bucket. */
  count: number;
}

/** BucketsResponse is a type returned from a query performing bucket aggregate. */
export interface BucketsResponse {
  [id: string]: BucketResponse;
}

export type MetricResponse = number;

export interface DateResponse {
  [id: string]: number;
}

export interface AggregateResponse {
  [id: string]: CountResponse | BucketsResponse | DateResponse | MetricResponse;
}

export interface Response {
  /** Reads is the total number of index values read. */
  reads: number;

  /** TotalResults is the total number of results. */
  totalResults: number;

  /** Time in seconds taken to perform the query. */
  time: number;

  /** Aggregates computed on the query results (see [[AggregateResponse]]). */
  aggregates: AggregateResponse;

  /** Results of the query. */
  results: Result[];
}
