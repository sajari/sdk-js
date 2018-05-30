import { AggregateResponse, Result, Results, ResultValues } from "./results";

/**
 * valueFromProto unpacks a proto value.
 */
export const valueFromProto = (proto: any): string | string[] | null => {
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
export const newResult = (resultJSON: any): Result => {
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

/**
 * newAggregates constructs an AggregateResponse object from proto
 */
export const newAggregates = (aggregateJSON: any = {}): AggregateResponse =>
  Object.keys(aggregateJSON).reduce((prev: AggregateResponse, cur) => {
    const [aggregateType, field] = cur.split(".");
    if (aggregateType === "count") {
      prev[cur] = aggregateJSON[cur].count.counts;
    }
    // todo(tbillington): implement bucket
    return prev;
  }, {});

/**
 * newResults constructs a Results object from a search reponse and array of tokens.
 */
export const newResults = (response: any = {}, tokens: any = []): Results => {
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
    reads: parseInt(response.reads, 10) || 0, // sometimes reads is not returned
    totalResults: parseInt(response.totalResults, 10) || 0, // sometimes totalResults is not returned
    time: parseFloat(response.time),
    aggregates: newAggregates(response.aggregates),
    results
  };
};

// newQueryID constructs a new ID for a query.
export const newQueryID = (): string => {
  let queryID = "";
  for (let i = 0; i < 16; i++) {
    queryID += "abcdefghijklmnopqrstuvwxyz0123456789".charAt(
      Math.floor(Math.random() * 36)
    );
  }
  return queryID;
};

/**
 * newRequest makes a XMLHttpRequest and handles network and parsing errors.
 */
export const newRequest = (
  address: string,
  body: any,
  callback: (error?: SearchError, response?: any) => void
): void => {
  const request = new XMLHttpRequest();
  request.open("POST", address, true);
  request.setRequestHeader("Accept", "application/json");
  request.setRequestHeader("Content-Type", "application/json");
  request.onreadystatechange = () => {
    if (request.readyState !== XMLHttpRequest.DONE) {
      return;
    }

    if (request.status === 0) {
      callback(makeError("connection error", 0), null);
      return;
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(request.responseText);
    } catch (e) {
      callback(makeError("error parsing response"), undefined);
      return;
    }

    if (request.status === 200) {
      callback(undefined, parsedResponse);
      return;
    }

    callback(makeError(parsedResponse.message, request.status), undefined);
  };

  request.send(body);
};
