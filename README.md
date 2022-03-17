# Search.io Javascript SDK

[![npm (scoped)](https://img.shields.io/npm/v/@sajari/sdk-js.svg?style=flat-square)](https://www.npmjs.com/package/@sajari/sdk-js)
[![Netlify Status](https://api.netlify.com/api/v1/badges/571108bf-6e93-4aab-8671-09a6f3b90722/deploy-status)](https://app.netlify.com/sites/sajari-sdk-js/deploys)
[![build size](https://img.shields.io/bundlephobia/minzip/@sajari/sdk-js.svg)](https://img.shields.io/bundlephobia/minzip/@sajari/sdk-js.svg)
[![license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

This SDK is a lightweight JavaScript client for querying the Search.io API.

Checkout our [React SDK](https://github.com/sajari/sdk-react), for a complete set of customisable UI components, and more.

You can also quickly generate search interfaces from the Search.io [admin console](https://app.search.io).

## Table of Contents

- [Install](#install)
- [Getting started](#getting-started)
- [Documentation](#documentation)
- [License](#license)

## Install

### NPM/Yarn

```shell
npm install --save @sajari/sdk-js@next

# or with yarn
yarn add @sajari/sdk-js@next
```

Usage within your application:

```javascript
import { Client, SearchIOAnalytics, etc... } from "@sajari/sdk-js";

const client = new Client("<account_id>", "<collection_id>");
```

### Browser

Note that when using the SDK via a `<script>` tag in a browser, all components will live under `window.SajariSDK`:

```html
<script src="https://unpkg.com/@sajari/sdk-js@^2/dist/sajarisdk.umd.production.min.js"></script>
<script>
  const client = new SajariSDK.Client("<account_id>", "<collection_id>");
</script>
```

## Getting started

Create a `Client` for interacting with our API, and then initialise a pipeline to be used for searching. The pipeline determines how the ranking is performed when performing a search.

_If you don't have a Search.io account you can [sign up](https://app.search.io/sign-up)._

```javascript
const pipeline = new Client("<account_id>", "<collection_id>").pipeline("app");
```

Create a `SearchIOAnalytics` instance to track events against the query id that produced a search result.

```javascript
const searchio = new SearchIOAnalytics("<account_id>", "<collection_id>");
```

Perform a search on the specified pipeline and handle the results. Here we're searching our collection using the `app` pipeline and updating the analytics instance with the current query id. The `field` value you specify must be the name of a field in [your schema](https://app.search.io/collection/schema) with the _Unique_ constraint.

```javascript
const values = { q: "puppies" };
pipeline
  .search(values, { type: "EVENT", field: "id" })
  .then(([response, values]) => {
    searchio.updateQueryId(response.queryId);
    // Handle response...
  })
  .catch((error) => {
    // Handle error...
  });
```

## Handling results

Now we're going to add a basic rendering of the results to the page with integrated event tracking.
This will persist the tracking event against the current query id in localStorage and send the event data to Search.io to track how users use search results and/or move through an ecommerce purchase funnel.

```javascript
const values = { q: "puppies" };
pipeline
  .search(values, { type: "EVENT", field: "id" })
  .then(([response, values]) => {
    searchio.updateQueryId(response.queryId);
    response.results.forEach((r) => {
      const item = document.createElement("a");
      item.textContent = r.values.name;
      item.href = r.values.url;
      item.onclick = () => {
        searchio.track("click", r.id);
      };

      document.body.appendChild(item);
    });
  })
  .catch((error) => {
    // Handle error...
  });
```

## Tracking additional events

When a user moves further through your purchase funnel (e.g. adding an item to their shopping cart, completing a purchase, etc) you'll want to track that also, as it will provide feedback to the ranking system. The correct query id will be preserved throughout the ecommerce funnel as long as an event with _type_ `click` was already tracked earlier.

```javascript
document.querySelector(".add-to-cart").addEventListener("click", (e) => {
  searchio.track("add_to_cart", e.target.id);
});

document.querySelector(".complete-purchase").addEventListener("click", (e) => {
  document.querySelectorAll(".cart-item").forEach((item) => {
    searchio.track("purchase", item.id);
  });
});
```

## Documentation

For full documentation, see [https://sajari-sdk-js.netlify.com/](https://sajari-sdk-js.netlify.com/).

## License

We use the [MIT license](./LICENSE)
