var Sajari = require("../dist.cjs/main.js");

var c = new Sajari.Client("project", "collection");
c.searchPipeline("pipeline", {}, new Sajari.Tracking(Sajari.clickTracking, "url"), (err, res) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(res);
});
