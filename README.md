# Sajari Javascript SDK

[![npm (scoped)](https://img.shields.io/npm/v/@sajari/sdk-js.svg?style=flat-square)](https://www.npmjs.com/package/@sajari/sdk-js)
[![build status](https://img.shields.io/travis/sajari/sajari-sdk-js/master.svg?style=flat-square)](https://travis-ci.org/sajari/sajari-sdk-js)
[![build size](https://img.shields.io/bundlephobia/minzip/@sajari/sdk-js.svg)](https://img.shields.io/bundlephobia/minzip/@sajari/sdk-js.svg)
[![license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

This SDK is a lightweight JavaScript client for querying the Sajari API.

Checkout our [React SDK](https://www.github.com/sajari/sajari-sdk-react), for a complete set of customisable UI components, and more.

You can also quickly generate search interfaces from the [Sajari](https://www.sajari.com/console) admin console.

## Table of Contents

- [Install](#install)
- [Getting Started](#getting-started)
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
import { Client, DefaultSession, TrackingType, etc... } from "@sajari/sdk-js";

// new Client("project", "collection")...
```

### Browser

Note that when using the SDK via a `<script>` tag in a browser, all components will live under `window.SajariSDK`:

```html
<script src="https://unpkg.com/@sajari/sdk-js/dist/sajarisdk.umd.production.min.js"></script>
<script>
  // new SajariSDK.Client("project", "collection")...
</script>
```

## Getting Started

Create a `Client` for interacting with our API, and then initialise a pipeline to be used for searching. The pipeline determines how the ranking is performed when performing a search.

_If you don't have a Sajari account you can sign up [here](https://www.sajari.com/console/sign-up)._

```javascript
const websitePipeline = new Client("<project>", "<collection>").pipeline(
  "website"
);
```

Create a session to track the queries being performed via click tracking. In this case we're using `q` to store the query on the `InteractiveSession`.

```javascript
const clickTrackedSession = new InteractiveSession(
  "q",
  new DefaultSession(TrackingType.Click, "url")
);
```

Perform a search on the specified pipeline and handle the results. Here we're searching our collection using the `website` pipeline with our tracked session.

```javascript
const values = { q: "FAQ" };
websitePipeline
  .search(values, clickTrackedSession.next(values))
  .then(([response, values]) => {
    // Handle response...
  })
  .catch(error => {
    // Handle error...
  });
```

## Handling results

Now we're going to add a basic rendering of the results to the page with integrated click tracking.
This will redirect the user through the Sajari token endpoint to the real page identified by the result, registering their "click" on the way through.

```javascript
const values = { q: "FAQ" };
websitePipeline
  .search(values, clickTrackedSession.next(values))
  .then(([response, values]) => {
    response.results.forEach(r => {
      const title = document.createElement("a");
      title.textContent = r.values.title;
      title.href = r.values.url;
      title.onmousedown = () => {
        title.href = r.token.click;
      };

      document.body.appendChild(title);
    });
  })
  .catch(error => {
    // Handle error...
  });
```

## Consuming an interaction token

On each result when using TrackingType.Click or TrackingType.PosNeg, there is a
set of tokens. These tokens allow you to provide feedback to the ranking system.
When a user interacts with a result, you can send back the token with some extra
information.

```js
const { Client } = require("@sajari/sdk-js");

const client = new Client("<project>", "<collection>", {
  key: "<key from console>",
  secret: "<secret from console>"
});

/*
The following invocation of the consume function, is noting that this particular
interaction was a "purchase" and the user purchasing the item was 20 years old
(this information coming from some system that you operate.)
*/
client.interactionConsume(token, "purchase", 1.0, {
  age: "20"
});
```

## Documentation

For full documentation, see [https://sajari-sdk-js.netlify.com/](https://sajari-sdk-js.netlify.com/).

## License

We use the [MIT license](./LICENSE)
