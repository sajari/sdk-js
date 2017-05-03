# Sajari Javascript SDK (Browser only)

[![npm](https://img.shields.io/npm/v/sajari.svg?style=flat-square)](https://www.npmjs.com/package/sajari) ![docs](https://doc.esdoc.org/github.com/sajari/sajari-sdk-js/badge.svg) [![license](http://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

The Sajari Javascript SDK provides a basic API for querying Sajari search services from web browsers.

If you are want to create a search UI for your website then you go to [Creating Website Search Interfaces](https://github.com/sajari/sajari-sdk-react/tree/master/examples/basic-site-integration).

## Table of Contents

* [Install](#intall)
* [Getting Started](#getting-started)
* [Documentation](#documentation)
* [License](#license)

## Install
```
npm install --save sajari
```

## Getting Started

A quick search example using the `website` search pipeline.

```javascript
import { Client, Tracking } from "sajari";

const client = new Client("<project>", "<collection>");

const tracking = new Tracking();
tracking.clickTokens("url");

client.searchPipeline(
  "website",
  { q: "Foo Bar", resultsPerPage: "10" },
  tracking,
  (err, res) => {
    console.log(err || res);
  }
);
```

The `Client` object handles making requests and callbacks.

## Documentation

Full documentation can be found at [https://doc.esdoc.org/github.com/sajari/sajari-sdk-js/](https://doc.esdoc.org/github.com/sajari/sajari-sdk-js/).

## License

We use the [MIT license](./LICENSE)
