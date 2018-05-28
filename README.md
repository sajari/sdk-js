# Sajari Javascript SDK (Browser only) &middot;
[![npm](https://img.shields.io/npm/v/sajari.svg?style=flat-square)](https://www.npmjs.com/package/sajari)
[![build status](https://img.shields.io/travis/sajari/sajari-sdk-js/master.svg?style=flat-square)](https://travis-ci.org/sajari/sajari-sdk-js)
[![docs](https://sajari.github.io/sajari-sdk-js/badge.svg)](https://sajari.github.io/sajari-sdk-js/)
[![license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

The Sajari Javascript SDK provides a basic API for querying Sajari search services from web browsers.

If you are want to create a search UI for your website then checkout our [React SDK](https://www.github.com/sajari/sajari-sdk-react) or generate a search interface from our [Console](https://www.sajari.com/console).

## Table of Contents

* [Install](#intall)
* [Getting Started](#getting-started)
* [Documentation](#documentation)
* [License](#license)

## Install

### NPM

```
npm install --save @sajari/sdk-js
```

### Browser

```html
<script src="https://unpkg.com/@sajari/sdk-js/dist.iife/main.js"></script>
```

## Getting Started

A quick search example using the `website` search pipeline.

```javascript
import { Client, TextSession, Session, TrackingClick } from "@sajari/sdk-js";

const client = new Client("sajariptyltd", "sajari-com").pipeline("website");
const session = new TextSession("q", new Session(TrackingClick, "url", {}));

client.search({ q: "hello world" }, session, (error, results, values) => {
  if (error) {
    console.error(error);
    return;
  }
  results.results.forEach(r => {
    console.log(r);
  });
});
```

## Documentation

Full documentation can be found at [https://sajari.github.io/sajari-sdk-js/](https://sajari.github.io/sajari-sdk-js/).

## License

We use the [MIT license](./LICENSE)
