import { Filter } from "../src/index";

describe("Filter", () => {
  it("constructs correct inital filter", () => {
    const f = new Filter({ all: "", blog: "dir1 = 'blog'" }, ["blog"]);
    expect(f.filter()).toBe("(dir1 = 'blog')");
  });

  it("set active filter", () => {
    const f = new Filter({ all: "", blog: "dir1 = 'blog'" }, ["blog"], false);
    f.set("all");
    expect(f.filter()).toBe("");
  });
});
