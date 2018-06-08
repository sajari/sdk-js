# Sajari Javascript SDK (Browser only) &middot;
[![npm](https://img.shields.io/npm/v/sajari.svg?style=flat-square)](https://www.npmjs.com/package/@sajari/sdk-js)
[![build status](https://img.shields.io/travis/sajari/sajari-sdk-js/master.svg?style=flat-square)](https://travis-ci.org/sajari/sajari-sdk-js)
[![build size](https://img.shields.io/bundlephobia/minzip/@sajari/sdk-js.svg)](https://img.shields.io/bundlephobia/minzip/@sajari/sdk-js.svg)
[![docs](https://sajari.github.io/sajari-sdk-js/badge.svg)](https://sajari.github.io/sajari-sdk-js/)
[![license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

The Sajari Javascript SDK provides a basic API for querying Sajari search services from web browsers.

If you are writing a React Application we recommend you look at our [React SDK](https://www.github.com/sajari/sajari-sdk-react), which provides a series of React components
for building search interfaces.

We also provide the ability to generate a search interface from our [Console](https://www.sajari.com/console).

## Table of Contents

* [Install](#intall)
* [Getting Started](#getting-started)
* [Documentation](#documentation)
* [License](#license)

## Install

### NPM/Yarn

```
npm install --save @sajari/sdk-js
```

### Browser

```html
<script src="https://unpkg.com/@sajari/sdk-js@1.0.0/dist.iife/main.js"></script>
```

## Getting Started

Here's a quick example that performs a search using the query "FAQ".

```javascript
import { Client, DefaultSession, TrackingNone } from "@sajari/sdk-js";

const pipeline = new Client("<project>", "<collection>").pipeline("website");
// Tracking is disabled due to not handling the results.
const session = new DefaultSession(TrackingNone, "url", {});

pipeline.search({ q: "FAQ" }, session, (error, results, values) => {
  if (error) {
    // handle error ...
  }
  // handle results and values ...
});
```

## Documentation

For full documentation, see [https://sajari.github.io/sajari-sdk-js/](https://sajari.github.io/sajari-sdk-js/).

## License

We use the [MIT license](./LICENSE)
