
var API = require("../src/js/api");
var test = require('tape');
var api = new API("", "", {});

var query = api.query({
	'q': 'whatever'
})
query.filter("this", "~", "that")
	.scale("lat", 50, 5, 1, 0)
	.scale("lng", 100, 5, 1, 0)
	.filter("location", "^", "usa")
	.meta("name", "fred")
	.append("tags", "hoops")
	.delta("count", 1)
	.set("category", "changed!")
	.attr("custom1", "abc")
	.page(3)
	.cols(["title", "description", "url"]);


// Run tests
test('Query encoding 1', function (t) {
    var enc = query.encode();
    t.equal(enc["filters"], "~this,that|^location,usa");
    t.equal(enc["scales"], "lat,50,5,1,0|lng,100,5,1,0");
    t.equal(enc["meta[name]"], "fred");
    t.equal(enc["set[category]"], "changed!");
    t.equal(enc["delta[count]"], 1);
    t.equal(enc["append[tags]"], "hoops");
    t.equal(enc["custom1"], "abc");
    t.equal(enc["page"], 3);
    t.equal(enc["cols"], "title,description,url");
    t.end();
});

var query2 = api.query({
	q: 'whatever',
	cols: ["title", "description", "url"],
	filters: [
		{ key: 'this', op: 'contains', value: 'that' },
		{ key: 'location', op: '^', value: 'usa' }
	],
	scales: [
		{ key: 'lat', centre: 50, radius: 5, start: 1, finish: 0 },
		{ key: 'lng', centre: 100, radius: 5, start: 1, finish: 0 }
	],
	meta: [
		{key: 'name', value: 'fred'}
	],
	page: 3,
	attrs: [
		{key: 'custom1', value: 'abc'}
	]
})

test('Query encoding 2', function (t) {
    var enc = query2.encode();
    t.equal(enc["filters"], "~this,that|^location,usa");
    t.equal(enc["scales"], "lat,50,5,1,0|lng,100,5,1,0");
    t.equal(enc["meta[name]"], "fred");
    t.equal(enc["custom1"], "abc");
    t.equal(enc["page"], 3);
    t.equal(enc["cols"], "title,description,url");
    t.end();
});


