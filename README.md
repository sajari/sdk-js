# Sajari Javascript SDK
[![npm](https://img.shields.io/npm/v/sajari.svg?style=flat-square)](https://www.npmjs.com/package/@sajari/sdk-js)
[![build status](https://img.shields.io/travis/sajari/sajari-sdk-js/master.svg?style=flat-square)](https://travis-ci.org/sajari/sajari-sdk-js)
[![build size](https://img.shields.io/bundlephobia/minzip/@sajari/sdk-js.svg)](https://img.shields.io/bundlephobia/minzip/@sajari/sdk-js.svg)
[![license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

This SDK is a lightweight JavaScript client for querying the Sajari API.

Checkout our [React SDK](https://www.github.com/sajari/sajari-sdk-react), for a complete set of customisable UI components, and more.

You can also quickly generate search interfaces from the [Sajari](https://www.sajari.com/console) admin console.

## Table of Contents

* [Install](#install)
* [Getting Started](#getting-started)
* [Documentation](#documentation)
* [License](#license)

## Install

### NPM/Yarn

```shell
npm install --save @sajari/sdk-js
```

Usage within your application:

```javascript
import { Client, DefaultSession, TrackingClick, etc... } from "@sajari/sdk-js";

// new Client("project", "collection")...
```

### Browser

Note that when using the SDK via a `<script>` tag in a browser, all components will live under `window.SajariSearch`:

```html
<script src="https://unpkg.com/@sajari/sdk-js@1.0.0/dist.iife/main.js"></script>
<script>
  // new SajariSearch.Client("project", "collection")...
</script>
```

## Getting Started

Create a `Client` for interacting with our API, and then initialise a pipeline to be used for searching. The pipeline determines how the ranking is performed when performing a search.

*If you don't have a Sajari account you can sign up [here](https://www.sajari.com/console/sign-up).*

```javascript
const websitePipeline = new Client("<project>", "<collection>").pipeline("website");
```

Create a session to track the queries being performed via click tracking. In this case we're using `q` to store the query on the `InteractiveSession`.

```javascript
const clickTrackedSession = new InteractiveSession("q", new DefaultSession(TrackingClick, "url", {}));
```

Perform a search on the specified pipeline and handle the results. Here we're searching our collection using the `website` pipeline with our tracked session.

```javascript
websitePipeline.search({ q: "FAQ" }, clickTrackedSession, (error, response, values) => {
  // Handle response here
});
```

## Handling results

Now we're going to add a basic rendering of the results to the page with integrated click tracking.
This will redirect the user through the Sajari token endpoint to the real page identified by the result, registering their "click" on the way through.

```javascript
websitePipeline.search({ q: "FAQ" }, clickTrackedSession, (error, response, values) => {
  // Check for error
  response.results.forEach(r => {
    const title = document.createElement("a");
    title.textContent = r.values.title;
    title.href = r.token.click;

    document.body.appendChild(title);
  });
});
```

## Documentation

For full documentation, see [https://sajari.github.io/sajari-sdk-js/](https://sajari.github.io/sajari-sdk-js/).

## License

We use the [MIT license](./LICENSE)
