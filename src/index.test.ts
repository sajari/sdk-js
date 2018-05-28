import {
  valueFromProto,
  newResult,
  newAggregates,
  newResults
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
        url: { single: url }
      },
      score,
      indexScore
    };
    expect(newResult(protoResult)).toEqual({
      values: { description, title, url },
      score,
      indexScore,
      tokens: {}
    });
  });
});

describe("newAggregates", () => {
  test("count", () => {
    const name = "count.category";
    const counts = { A: 1, B: 2, C: 3 };
    const protoAggregate = { [name]: { count: { counts } } };
    expect(newAggregates(protoAggregate)).toEqual({ [name]: counts });
  });
  test("bucket", () => {
    // ?
  });
});

describe("newResults", () => {
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

    const results = newResults(protoResponse, protoTokens);
    expect(results.results).toContainEqual({
      values: { body: singleValue, tags: repeatedValue },
      score,
      indexScore,
      tokens: { click: { token: tokenValue } }
    });
  });
});
