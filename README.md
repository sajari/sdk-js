# sajari-sdk-js
Sajari JavaScript SDK for integration into web and nodejs applications

[Sajari Search](https://www.sajari.com) is a hosted search and recommendation service supporting instant search, faceted search, recommendations and custom matching algorithms

This module is to interact with the raw API. If you want automated indexing, profiling and convenience functions for rendering HTML, please check out [sajari-website](https://github.com/sajari/sajari-sdk-website) instead.

[![Version][version-svg]][package-url] [![License][license-image]][license-url] [![Downloads][downloads-image]][downloads-url]

[license-image]: http://img.shields.io/badge/license-MIT-green.svg?style=flat-square
[license-url]: LICENSE.txt
[downloads-image]: https://img.shields.io/npm/dm/sajari.svg?style=flat-square
[downloads-url]: http://npm-stat.com/charts.html?package=sajari
[version-svg]: https://img.shields.io/npm/v/sajari.svg?style=flat-square
[package-url]: https://npmjs.org/package/sajari

This library is [UMD](https://github.com/umdjs/umd) compatible, you can use it with any module loader. It can be used with nodejs, or integrated into browser applications (read requests). 

To install:

##### NPM, Browserify, webpack, node.js
```
npm install sajari --save
```

##### Quick start for browsers (read requests only):

Note: browsers use the "jsonp" option to make cross domain AJAX requests. A key-secret is not required, the companyId-collectionId combination will check for allowed domains and authorize accordingly. If you get 401 errors, make sure the calling domain is added in your control panel for this collection.

```js
var sajari = require('sajari');
api = new sajari('companyId', 'collectionId', {
	jsonp: true
});

var query = api.query({
	'q': 'whatever'
})

api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```

##### Quick start for server side:

Note: server side integrations can use the private key-secret combination to access both read and write requests. Do NOT use your private key-secret in a browser based application.

```js
var sajari = require('sajari');
api = new sajari('companyId', 'collectionId', {
	basicauth : {
	  user : 'key',
	  pass : 'secret'
  }
);

var query = api.query({
	'q': 'whatever'
})

api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```

Notes:
- You don't need to keep initializing the `api`, you only need to do this once unless you want to change config, collection, etc.
- The `args` object is very generic and supports anything in our [API spec](https://www.sajari.com/api-documentation#attributes)
- Some of our parameters are more complex, the `query` object helps [encode args](#args)

### Query object

A new `query` object can be initialized with `opts`:

`opts` can be an object:
```js
var query = api.query({
  q : 'something',
  custom1 : 'group A',
  cols: ['title', 'description', 'url']
});
```

`opts` can also be a query string:
```js
var query = api.query('something');
```

Sajari has many [supported attributes](https://www.sajari.com/api-documentation#attributes) with query methods. These can also be chained:
```js
var query = api.query('something')
  .filter("this", "~", "that")
  .scale("lat", 50, 5, 1, 0)
  .scale("lng", 100, 5, 1, 0)
  .filter("location", "contains", "usa")
  .meta("category", "electronics")
  .attr("custom1", "abc")
  .page(3)
  .maxresults(5)
  .cols(["title", "description", "url"]);
	
api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```

In the above case, the query is passed directly to the search function, which handles the appropriate encoding for you.


### Search

Sajari supports multiple types of searches, which are all relatively interchangeable and use the same API endpoint:

- **instant** - used for "as you type" style keyword searches. Partial words are extended to full queries. Spelling errors are corrected if the query cannot be extended as is, etc.
- **match** - keyword queries are augmented with meta data, which is used to boost results in various ways. Unlike filters, this does not exclude any results, but rather changes their ranking.
- **document** - full documents can be used as queries themselves. 
- **faceted** - generally used with keyword style searches to get aggregate information about matching results meta

All searches can also be filtered, scaled (based on numeric meta).

Instant search example (should be triggered using the keyup event or similar):
```js
var query = api.query('di');
	
api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```

Match example (search must have "jaguar", prefer color="red" & category="cars"):
```js
var query = api.query('jaguar')
  .meta("color", "red")
  .meta("category", "cars");
	
api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```

Field Facet example (top 10 categories and colors for docs matching the "jaguar" query):
```js
var query = api.query('jaguar')
  .facetfields(['category', 'color'], 10);
	
api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```

Metric Facet example (get the count for price brackets of 10,000 from 0 - 200,000 for all docs matching the "jaguar" query): 
```js
var query = api.query('jaguar')
  .filter("color", "=", "red")
  .metricfacet('price', 0, 200000, 10000);
	
api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```


### Recommendations

Sajari supports two main groups types of recommendations: 

1. Website recommendations - Typically they require information from the current web page, visitor profile, etc. So although they are very analogous to the "search" function, we would advise those looking for website recommendations to use [sajari-website](https://github.com/sajari/sajari-sdk-website) instead, as that module integrates into the DOM, handles user profile cookies, etc.

2. Custom recommendations - These typically use the "search" function, but include "meta" parameters to help power the recommendation. The way information is used in the recommendation algorithm is [highly configurable](https://www.sajari.com/configuration#fields).

Example below:

```js
var query = api.query()
  .meta("category", "electronics")
  .meta("price", 25.00)
  .meta("segment", "luxury")
  .meta("brand", "samsung")
  .meta("tags", ["phone", "oled", "silver"])
  .filter("sku", "!=", "J12345")
  .maxresults(5);
  
api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```


