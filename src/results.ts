export type ResultValue = string | number | boolean;

export interface ResultValues {
  [id: string]: ResultValue | ResultValue[];
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