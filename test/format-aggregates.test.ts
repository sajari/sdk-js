import { formatAggregates } from "../src/index";

describe("formatAggregates", () => {
  it("correctly include all bucket aggregates", () => {
    const input = {
      fastDispatchBucket: {
        buckets: {
          buckets: {
            fast_dispatch: {
              name: "fast_dispatch",
              count: 66,
            },
          },
        },
      },
      koganFirstPriceBucket: {
        buckets: {
          buckets: {
            has_kogan_first_price: {
              name: "has_kogan_first_price",
              count: 52,
            },
          },
        },
      },
    };
    const output = {
      buckets: {
        count: {
          fast_dispatch: 66,
          has_kogan_first_price: 52,
        },
      },
    };

    expect(formatAggregates(input)).toEqual(output);
  });
});
