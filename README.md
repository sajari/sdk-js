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

var args = {
  q : "something"
};

api.search(args, function success(res) {
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

var args = {
  q : "something"
};

api.search(args, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```

Notes:
- You don't need to keep initializing the `api`, you only need to do this once unless you want to change config, collection, etc.
- The `args` object is very generic and supports anything in our [API spec](https://www.sajari.com/api-documentation#attributes)
- Some of our parameters are more complex, the `query` object helps [encode args](#args)

### Args

Creating a new `query` object from the initialized API is very simple:
```js
var query = api.query(opts);
```

`opts` can be a query string:
```js
var query = api.query('something');
```

`opts` also allows an object of args to be passed directly:
```js
var query = api.query({
  q : 'something',
  custom1 : 'group A',
  cols: ['title', 'description', 'url']
});
```

Sajari has many [supported attributes](https://www.sajari.com/api-documentation#attributes). Many have convenience wrappers as per below, these can also be chained:
```js
var query = api.query('something')
  .filter("this", "~", "that")
  .scale("lat", 50, 5, 1, 0)
	.scale("lng", 100, 5, 1, 0)
	.filter("location", "^", "usa")
	.meta("category", "electronics")
	.attr("custom1", "abc")
	.page(3)
	.cols(["title", "description", "url"]);
	
api.search(query, function success(res) {
  console.log(res);
}, function failure(err) {
  console.log(err);
});
```

In the above case, the query is passed directly to the search function, which will decode it automatically into args.



