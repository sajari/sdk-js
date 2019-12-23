import {
  CombineFilters,
  Filter,
  EVENT_OPTIONS_UPDATED,
  EVENT_SELECTION_UPDATED
} from "../src/index";

describe("CombineFilters", () => {
  const filterOne = new Filter(
    { all: 'product === "all"', website: 'product === "website"' },
    ["all"],
    false
  );

  const filterTwo = new Filter(
    {
      all: 'topic === "all"',
      developer: 'topic === "developer"',
      design: 'topic === "design"'
    },
    ["all"],
    false
  );

  it("Should return correct combined filter query with AND", () => {
    const combine = CombineFilters([filterOne, filterTwo], "AND");

    expect(combine.filter()).toBe(
      `((product === "all")) AND ((topic === "all"))`
    );
  });

  it("Should return correct combined filter query with OR", () => {
    const combine = CombineFilters([filterOne, filterTwo], "OR");

    expect(combine.filter()).toBe(
      `((product === "all")) OR ((topic === "all"))`
    );
  });

  it("Should update to return correct combined filter query if Filter is set another value", () => {
    const combine = CombineFilters([filterOne, filterTwo]);

    filterOne.set("website", true);
    filterTwo.set("developer", true);

    expect(combine.filter()).toBe(
      `((product === "website")) AND ((topic === "developer"))`
    );
  });

  it("Should fire EVENT_SELECTION_UPDATED callback if Filter selection changed", () => {
    const combine = CombineFilters([filterOne, filterTwo]);
    const eventSelectionUpdatedCallback = jest.fn();

    combine.on(EVENT_SELECTION_UPDATED, eventSelectionUpdatedCallback);
    filterTwo.set("design", true);
    filterOne.set("website", true);

    expect(eventSelectionUpdatedCallback).toBeCalledTimes(2);
  });

  it("Should fire EVENT_OPTIONS_UPDATED callback if Filter options changed", () => {
    const combine = CombineFilters([filterOne, filterTwo]);
    const eventOptionsUpdatedCallback = jest.fn();

    combine.on(EVENT_OPTIONS_UPDATED, eventOptionsUpdatedCallback);
    filterTwo.updateOptions({
      new: 'topic === "new"'
    });

    expect(eventOptionsUpdatedCallback).toBeCalledTimes(1);
  });
});
