# Sajari Javascript SDK

![npm](https://img.shields.io/npm/v/sajari.svg?style=flat-square) ![license](http://img.shields.io/badge/license-MIT-green.svg?style=flat-square)

The Sajari Javascript SDK provides web integration for browsers.

[Sajari Search](https://www.sajari.com) is a hosted search and recommendation service supporting instant search, faceted search, recommendations and custom matching algorithms

This module is for querying the search service. If you want automated indexing, profiling and convenience functions for rendering HTML, please check out [sajari-website](https://github.com/sajari/sajari-sdk-website) instead.

## Table of Contents

* [Setup](#setup)
  * [Npm, Browserify, Webpack](#npm-browserify-webpack)
* [Getting Started](#getting-started)
* [Documentation](#documentation)
* [License](#license)
* [Browser Support](#browser-support)

## Setup

The library is 10KB minified and 3KB gzipped.

### NPM, Browserify, webpack
```
npm install sajari --save
```

## Getting Started
```javascript
import { Api, Query, body } from 'sajari'

const api = new Api('project', 'collection')
const query = new Query()

query.body([
  body("foo bar")
])

api.search(query, (err, res) => {
  console.log(err, res)
})
```

The `Api` object handles the requesting and callbacks. If you need to override the default address, you can supply an extra parameter to `Api`:

```javascript
new Api('project', 'collection', 'http://localhost:8000')
```

The `Query` object handles the query state. Use the methods on it to define your queries.

## Documentation

Documentation can be found at [https://doc.esdoc.org/github.com/sajari/sajari-sdk-js/](https://doc.esdoc.org/github.com/sajari/sajari-sdk-js/).

## License

We use the [MIT license](./LICENSE)

## Browser Support

This library uses the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). Fetch is available on all evergreen browsers (Chrome, Firefox, Edge), see [here](http://caniuse.com/#feat=fetch) for a more complete overview. We recommend using [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch) to increase compatibility across other browsers and [Node.js](https://nodejs.org).
