import { Filter } from "../src/index";

describe("Filter", () => {
  it("constructs correct inital filter", () => {
    const f = new Filter({ all: "", blog: "dir1 = 'blog'" }, ["blog"]);
    expect(f.filter()).toBe("(dir1 = 'blog')");
  });

  it("constructs correct multiple-select filter", () => {
    const f = new Filter(
      {
        blog: "dir1='blog'",
        articles: "dir1='articles'",
        other: "dir1!='blog' AND dir1!='articles'"
      },
      ["blog", "articles"],
      true
    );
    expect(f.filter()).toBe("(dir1='blog') OR (dir1='articles')");
  });

  it("constructs correct filter with AND join operation", () => {
    const f = new Filter(
      {
        faq: "dir1='faq'",
        usecases: "dir1='usecases'"
      },
      ["faq", "usecases"],
      true,
      "AND"
    );
    expect(f.filter()).toBe("(dir1='faq') AND (dir1='usecases')");
  });

  it("set active filter", () => {
    const f = new Filter({ all: "", blog: "dir1 = 'blog'" }, ["blog"], false);
    f.set("all");
    expect(f.filter()).toBe("");
  });
});
