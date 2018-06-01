import {
  newAggregates,
  newResult,
  processSearchResponse,
  valueFromProto
} from "./constructors";

describe("valueFromProto", () => {
  test("single", () => {
    const value = "foobar";
    const protoValue = { single: value };
    expect(valueFromProto(protoValue)).toBe(value);
  });
  test("repeated", () => {
    const values = ["foobar"];
    const protoValue = { repeated: { values } };
    expect(valueFromProto(protoValue)).toBe(values);
  });
  test("null", () => {
    const value = null;
    const protoValue = { null: true };
    expect(valueFromProto(protoValue)).toBe(value);
  });
});

describe("newResult", () => {
  test("sample result", () => {
    const description = "desc";
    const title = "title";
    const url = "url";
    const score = 0.063;
    const indexScore = 0.13;
    const protoResult = {
      values: {
        description: { single: description },
        title: { single: title },
        url: { single: url },
        foobar: { null: true }
      },
      score,
      indexScore
    };
    expect(newResult(protoResult)).toEqual({
      values: { description, title, url },
      score,
      indexScore,
      token: {}
    });
  });
});

describe("newAggregates", () => {
  test("bucket", () => {
    const name = "bucket.somefield";
    const buckets = { somebucket: { name: "some", count: 5 } };
    const protoAggregate = { [name]: { buckets: { buckets } } };
    expect(newAggregates(protoAggregate)).toEqual({ [name]: buckets });
  });
  test("count", () => {
    const name = "count.category";
    const counts = { A: 1, B: 2, C: 3 };
    const protoAggregate = { [name]: { count: { counts } } };
    expect(newAggregates(protoAggregate)).toEqual({ [name]: counts });
  });
  test("date", () => {
    const name = "date.date_issued";
    const dates = { "2017": 24, "2018": 25 };
    const protoAggregate = { [name]: { date: { dates } } };
    expect(newAggregates(protoAggregate)).toEqual({ [name]: dates });
  });
  test("metric", () => {
    const name = "metric.somefield";
    const value = 5;
    const protoAggregate = { [name]: { metric: { value } } };
    expect(newAggregates(protoAggregate)).toEqual({ [name]: value });
  });
});

describe("processSearchResponse", () => {
  test("basic", () => {
    const singleValue = "single-val";
    const repeatedValue = ["repeated-val"];
    const tokenValue = "token-val";
    const score = 0.9;
    const indexScore = 1;
    const protoResponse = {
      results: [
        {
          values: {
            body: {
              single: singleValue
            },
            tags: { repeated: { values: repeatedValue } }
          },
          score,
          indexScore
        }
      ]
    };
    const protoTokens = [
      {
        click: {
          token: tokenValue
        }
      }
    ];

    const results = processSearchResponse(protoResponse, protoTokens);
    expect(results.results).toContainEqual({
      values: { body: singleValue, tags: repeatedValue },
      score,
      indexScore,
      token: { click: tokenValue }
    });
  });
  test("posNeg tokens", () => {
    const protoResponse = {
      results: [{ values: {}, score: 0, indexScore: 0 }]
    };
    const token = { pos: "a", neg: "b" };
    const protoTokens = [{ posNeg: token }];
    expect(
      processSearchResponse(protoResponse, protoTokens).results
    ).toContainEqual({ values: {}, score: 0, indexScore: 0, token });
  });
  test("no tokens", () => {
    const protoResponse = {
      results: [{ values: {}, score: 0, indexScore: 0 }]
    };
    expect(
      processSearchResponse(protoResponse, []).results
    ).toContainEqual({ values: {}, score: 0, indexScore: 0, token: {} });
  });
  test("unknown token type not erroring", () => {
    const protoResponse = {
      results: [{ values: {}, score: 0, indexScore: 0 }]
    };
    const token = { magic: "type" };
    const protoTokens = [{ newTokenType: token }];
    expect(
      processSearchResponse(protoResponse, protoTokens).results
    ).toContainEqual({ values: {}, score: 0, indexScore: 0, token: {} });
  });
});
