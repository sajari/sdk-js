import {
  AggregateResponse,
  Result,
  Results,
  ResultValues,
  Token
} from "./results";

/** @hidden */
export interface ProtoSingleValue {
  single: string;
}

/** @hidden */
export interface ProtoRepeatedValue {
  repeated: { values: string[] };
}

/** @hidden */
export interface ProtoNullValue {
  null: boolean;
}
/**
 * ProtoValue describes a proto value received in a search response.
 * @hidden
 */
export type ProtoValue = ProtoSingleValue | ProtoRepeatedValue | ProtoNullValue;

/**
 * valueFromProto unpacks a proto value.
 * @hidden
 */
export const valueFromProto = (proto: ProtoValue): string | string[] | null => {
  if ((proto as ProtoSingleValue).single !== undefined) {
    return (proto as ProtoSingleValue).single;
  }
  if ((proto as ProtoRepeatedValue).repeated instanceof Object) {
    return (proto as ProtoRepeatedValue).repeated.values;
  }
  return null;
};

/**
 * newResult constructs a Result from a proto Result.
 * @hidden
 */
export const newResult = (resultJSON: any): Result => {
  const values: ResultValues = {};
  Object.keys(resultJSON.values).forEach(k => {
    const val = valueFromProto(resultJSON.values[k]);
    if (val !== null) {
      values[k] = val;
    }
  });
  return {
    values,
    token: {} as Token,
    score: parseFloat(resultJSON.score),
    indexScore: parseFloat(resultJSON.indexScore)
  };
};

/**
 * newAggregates constructs an AggregateResponse object from proto
 * @hidden
 */
export const newAggregates = (aggregateProto: any = {}): AggregateResponse =>
  Object.keys(aggregateProto).reduce((agg: AggregateResponse, key) => {
    const type = key.split(".")[0];
    switch (type) {
      case "bucket":
        agg[key] = aggregateProto[key].buckets.buckets;
        break;
      case "count":
        agg[key] = aggregateProto[key].count.counts;
        break;
      case "date":
        agg[key] = aggregateProto[key].date.dates;
        break;
      case "metric":
        agg[key] = aggregateProto[key].metric.value;
        break;
    }
    return agg;
  }, {});

/**
 * newResults constructs a Results object from a search reponse and array of tokens.
 * @hidden
 */
export const processSearchResponse = (
  response: any = {},
  tokens: any = []
): Results => {
  const results = (response.results || []).map((r: any, i: number) => {
    const result = newResult(r);
    const token = tokens[i];
    if (token === undefined) {
      return result;
    }
    if (token.click !== undefined) {
      result.token = { click: token.click.token };
      return result;
    }
    if (token.posNeg !== undefined) {
      result.token = { pos: token.posNeg.pos, neg: token.posNeg.neg };
      return result;
    }
    // this leaves room for future token types
    return result;
  });
  return {
    reads: parseInt(response.reads, 10) || 0, // sometimes reads is not returned
    totalResults: parseInt(response.totalResults, 10) || 0, // sometimes totalResults is not returned
    time: parseFloat(response.time) || 0, // sometimes time is not returned
    aggregates: newAggregates(response.aggregates),
    results
  };
};
