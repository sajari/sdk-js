# Sajari Javascript SDK

![npm](https://img.shields.io/npm/v/sajari.svg?style=flat-square) ![license](http://img.shields.io/badge/license-MIT-green.svg?style=flat-square)

The Sajari Javascript SDK provides web integration for browsers.

[Sajari Search](https://www.sajari.com) is a hosted search and recommendation service supporting instant search, faceted search, recommendations and custom matching algorithms

This module is for querying the search service. If you want automated indexing, profiling and convenience functions for rendering HTML, please check out [sajari-website](https://github.com/sajari/sajari-sdk-website) instead.

## Table of Contents

* [Setup](#setup)
  * [Npm, Browserify, Webpack](#npm-browserify-webpack)
* [Getting Started](#getting-started)
* [Body](#body)
* [Page](#page)
* [Results Per Page](#resultsperpage)
* [Filter](#filter)
* [Sorting](#sorting)
* [Aggregates](#aggregates)
* [Instance Boosts](#instance-boosts)
* [Field Boosts](#field-boosts)
* [Tokens](#tokens)
  * [Pos Neg](#pos-neg)
  * [Click](#click)
* [Results](#results)
* [Reset ID]($reset-id)
* [License](#license)
* [Browser Support](#browser-support)

## Setup

The library is 5.2kb minified and 2kb gzipped.

### NPM, Browserify, webpack
```
npm install sajari --save
```

## Getting Started
```javascript
import { Api, Query, body } from 'sajari';

const api = new Api('project', 'collection');
const query = new Query();

query.body([
  body("foo bar")
]);

api.search(query, (err, res) => {
  console.log(err, res);
});
```

The `Api` object handles the requesting and callbacks. If you need to override the default address, you can supply an extra parameter to `Api`:

```javascript
new Api('project', 'collection', 'http://localhost:8000')
```

The `Query` object handles the query state. Use the methods on it to define your queries.

## Body

`body` is the text to search for in the collection. It takes a string, and an optional decimal number between 0 and 1 for the weighting.

The `query.body()` method takes an array of `body`. This is useful if you would like to weigh some words differently.

### Simple example

```javascript
query.body([
  body('computer parts')
])
```

### Expanded example

```javascript
query.body([
  body('red computer parts', 1),
  body('laptop', 0.8),
  body('desktop', 0.8),
]);
```

## Page

To use pagination, set the page value on the query via the `query.page()` method.

### Example

```javascript
query.page(2);
```

## ResultsPerPage

To set the maximum number of results to be returned by one query use `query.resultsPerPage()`. Use in conjunction with page to support pagination.

### Example

```javascript
query.resultsPerPage(20);
```

## Filter

Filters let you exclude documents from the result set. A query only has 1 filter attached to it, but it is still possible to construct arbitrarily nested filters to satisfy any query logic.

Field filters act on a value in a field, resulting in a true or false result.

| Query Filter | JS Equivalent |
| :-- | :-- |
| `FILTER_OP_EQ` | `field === value` |
| `FILTER_OP_NOT_EQ` | `field !== value` |
| `FILTER_OP_GT` | `field > value` |
| `FILTER_OP_GT_EQ` | `field >= value` |
| `FILTER_OP_LT` | `field < value` |
| `FILTER_OP_LT_EQ` | `field <= value` |
| `FILTER_OP_CONTAIN` | `array.contains(value)` |
| `FILTER_OP_NOT_CONTAIN` | `!array.contains(value)` |
| `FILTER_OP_PREFIX` | `string.startWith(value)` |
| `FILTER_OP_SUFFIX` | `string.endsWith(value)` |

Combinator filters act on an array of filters, also resulting in a true of false result.

| Query Filter Combinator |
| :-- |
| `COMB_FILTER_ALL` |
| `COMB_FILTER_ANY` |
| `COMB_FILTER_ONE` |
| `COMB_FILTER_NONE` |

### Filter Example

```javascript
query.filter(
  fieldFilter('price', 100, FILTER_OP_LT)
);
```

### Combinator Filter Example

```javascript
query.filter(
  combinatorFilter([
    fieldFilter('price', 100, FILTER_OP_LT),
    fieldFilter('stock', 3, FILTER_OP_GT_EQ)
  ], COMB_FILTER_OP_ALL)
);
```

## Sorting

Sorts allow you to order your results based on their fields. Queries can take multiple sorts, using successive sorts to resolve ties.

## Sort Example

```javascript
query.sort([
  sort('price', SORT_ASCENDING)
])
```

## Expanded Sort Example

```javascript
query.sort([
  sort('rating', SORT_DESCENDING),
  sort('price', SORT_ASCENDING),
  sort('performance', SORT_DESCENDING),
])
```

## Aggregates

Aggregates give you information about your data.

There are 3 types of aggregates. Metric and Count both work on fields, while Bucket works  on Filters.

- Metric - statistical information such as minimum, maximum, count, average, and sum.
- Count - the counts for each value.
- Bucket - counts of categories that match the supplied filters

| Metric Aggregate Type |
| :-- |
| `METRIC_TYPE_MAX` |
| `METRIC_TYPE_MIN` |
| `METRIC_TYPE_AVG` |
| `METRIC_TYPE_SUM` |

### Metric example

```javascript
query.aggregates([
  metricAggregate('Most expensive part', 'price', METRIC_TYPE_MAX),
  metricAggregate('Least expensive part', 'price', METRIC_TYPE_MIN),
  metricAggregate('Average price of part', 'price', METRIC_TYPE_AVG),
  metricAggregate('Number of parts available', 'quantity', METRIC_TYPE_SUM),
]);
```

### Count example

```javascript
query.aggregates([
  countAggregate('Number of parts by manufacturer', 'manufacturer')
]);
```

### Bucket example

```javascript
query.aggregates([
  bucketAggregate(
    'Price groups',
    [
      bucket('$0 - $99',
        fieldFilter('price', 100, FILTER_OP_LT)
      )
      bucket('$100 - $199',
        combinatorFilter([
          fieldFilter('price', 100, FILTER_OP_GT_EQ),
          fieldFilter('price', 200, FILTER_OP_LT),
        ], COMB_FILTER_ALL)
      ),
      bucket('$200+',
        fieldFilter('price', 200, FILTER_OP_GT)
      ),
    ]
  )
]);
```

## Instance boosts

Instance boosts can influence the scoring of indexed fields. This is commonly used to make the title or keywords of a page play a larger role.

### Field Instance Boost Example

```javascript
query.instanceBoosts([
  fieldInstanceBoost('title', 1.5) // Score from the title field is now worth 1.5x.
]);
```

### Score Instance Boost Example

```javascript
query.instanceBoosts([
  scoreInstanceBoost(2)
]);
```

## Field boosts

Field boosts allow you to influence the scoring of results based on the data in certain meta fields. In theory they are similar to filters that influence the score rather than exclude/include documents.

The most obvious boost is a filter boost. It applies a boost if the document matches the filter.

### Filter Field Boost Example

```javascript
query.fieldBoosts([
  filterFieldBoost(fieldFilter('price', 100, FILTER_OP_LT), 2) // Double the score of items with 'price' less than 100.
]);
```

### Additive Field Boost Example

```javascript
query.fieldBoosts([
  additiveFieldBoost(filterFieldBoost(fieldFilter('price', 100, FILTER_OP_LT), 2), 0.5) // Make the filterFieldBoost worth half of the total score.
])
```

If you had latitude and longitude fields, geo-boosting is a good option to get location-aware results.

### Geo Field Boost Example

| Geo Boost Regions |
| :-- |
| `GEO_FIELD_BOOST_REGION_INSIDE` |
| `GEO_FIELD_BOOST_REGION_OUTSIDE` |

```javascript
query.fieldBoosts([
  geoFieldBoost('lat', 'lng', -33.8688, 151.2093, 50, 2, GEO_FIELD_BOOST_REGION_INSIDE) // Multiply the score of documents within 50km of Sydney by 2x.
]);
```

If you would like to scale a value based on arbitrary points, you can use the interval boost.

### Interval Field Boost Example

This will scale the score based on a sliding scale defined through points.

```javascript
query.fieldBoosts([
  intervalFieldBoost('performance', [
    pointValue(0, 0.5),
    pointValue(80, 1),
    pointValue(100, 1.5),
  ])
]);
```

Distance boosts let you boost a result if it's within a certain distance from a reference point.

### Distance Field Boost Example

```javascript
query.fieldBoosts([
  distanceFieldBoost(0, 20, 50, 'price', 2) // Double the score of a value from 'price' if it's between 0 and 20 away from 50.
]);
```

### Element Field Boost Example

Element field boosts can be applied to string arrays.

```javascript
query.fieldBoosts([
  elementFieldBoost('keywords', ['sale', 'deal']) // Boost results with 'sale' and 'deal' values in the 'keywords' field.
]);
```

### Text Field Boost Example

```javascript
query.fieldBoosts([
  textFieldBoost('description', 'reviews') // Boost results with the word 'reviews' in the 'description' field.
])
```

## Tokens

### Pos Neg

The argument to `posNeg` is the field to use. It must be unique.

```javascript
query.posNeg('url')
```

### Click

The argument to `click` is the field to use. It must be unique.

```javascript
query.click('url')
```

## Results

The results that come back from a successful search look like this

```javascript
{
  reads: "1000", // Engine read 1000 documents
  totalResults: "50", //  50 documents matches the query
  time: "2.2ms", // Time taken
  aggregates: {...}, // An object describing the results of the various aggregates applied to the query
  results: [
    {
      meta: {
        _id: "49913-3c39-7e62-7b81-3ec5a156", // Auto generated unique id for the document
        title: "New Computer Part Sale!",
        url: "/awesome_part.html",
        description: "Super awesome part, does x, y, z...",
        price: 59.99,
        keywords: ['sale', 'deal', 'part'],
        ...
      },
      score: 0.4, // Score of the document with boosts applied
      rawScore: 0.4 // Score of the document without boosts applied
    },
    ...
  ]
}
```

The `results` property is an array of objects, each containing their score, and meta fields.

## Reset ID

This method is used if you would like the next search you perform to count as a different query. This has more to do with stats and won't directly affect your query in any way.

## License

We use the [MIT license](./LICENSE)

## Browser Support

This library uses the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). Fetch is available on all evergreen browsers (Chrome, Firefox, Edge), see [here](http://caniuse.com/#feat=fetch) for a more complete overview. We recommend using [isomorphic-fetch](https://github.com/matthew-andrews/isomorphic-fetch) to increase compatibility across other browsers and [Node.js](https://nodejs.org).
