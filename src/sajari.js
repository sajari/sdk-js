// Api handles the searching of queries and keeping track of query id and sequence
export class Api {

  // constructor takes sajari project and collection details, and an optional address as an override
  constructor(project, collection, address) {
    this.p = project;
    this.c = collection;
    this.a = address || 'https://apid.sajari.com:9200/search-v10/';
  }

  // search takes a query, success and error callbacks
  search(query, callback) {
    // create a new XMLHttpRequest for the search
    const request = new XMLHttpRequest();

    // specify POST, the address, and async is true
    request.open('POST', this.a, true);
    request.setRequestHeader('Accept', 'application/json');

    request.onreadystatechange = () => {
      // if the request is not done, do nothing
      if (request.readyState !== 4) {
        return;
      }

      if (request.status === 200) {
        callback(null, JSON.parse(request.responseText));
      } else {
        callback(request.responseText, null);
      }
    };

    // Add project, collection, query sequence, and query id to the query and send it
    request.send(JSON.stringify({
      request: query.q,
      project: this.p,
      collection: this.c,
      // eslint-disable-next-line no-param-reassign
      sequence: query.s++, // Increment query sequence
      id: query.i,
    }));

    return request;
  }
}

/* Body */

export function body(text, weight) {
  return { text, weight: weight || 1 };
}

/* Aggregate */

export const METRIC_TYPE_MAX = 'MAX';
export const METRIC_TYPE_MIN = 'MIN';
export const METRIC_TYPE_AVG = 'AVG';
export const METRIC_TYPE_SUM = 'SUM';

export function metricAggregate(name, field, type) {
  return [name, { metric: { field, type } }];
}

export function countAggregate(name, field) {
  return [name, { count: { field } }];
}

export function bucket(name, filter) {
  return { name, filter };
}

export function bucketAggregate(name, buckets) {
  return [name, { bucket: { buckets } }];
}

/* Filters */

export const FILTER_OP_EQ = 'EQUAL_TO';
export const FILTER_OP_NOT_EQ = 'DOES_NOT_EQUAL';
export const FILTER_OP_GT = 'GREATER_THAN';
export const FILTER_OP_GT_EQ = 'GREATER_THAN_OR_EQUAL_TO';
export const FILTER_OP_LT = 'LESS_THAN';
export const FILTER_OP_LT_EQ = 'LESS_THAN_OR_EQUAL_TO';
export const FILTER_OP_CONTAINS = 'CONTAINS';
export const FILTER_OP_NOT_CONTAIN = 'DOES_NOT_CONTAIN';
export const FILTER_OP_SUFFIX = 'HAS_SUFFIX';
export const FILTER_OP_PREFIX = 'HAS_PREFX';

export function fieldFilter(field, value, operator) {
  // eslint-disable-next-line no-use-before-define
  return { field: { field, value: encode(String(value)), operator } };
}

/* Filter Combinators */

export const COMB_FILTER_OP_ALL = 'ALL';
export const COMB_FILTER_OP_ANY = 'ANY';
export const COMB_FILTER_OP_ONE = 'ONE';
export const COMB_FILTER_OP_NONE = 'NONE';

export function combinatorFilter(filters, operator) {
  return { combinator: { filters, operator } };
}

/* Index Boosts */

export function fieldInstanceBoost(field, value) {
  return { field: { field, value } };
}

export function scoreInstanceBoost(threshold) {
  return { score: { threshold } };
}

/* Meta Boosts */

export function filterFieldBoost(filter, value) {
  return { filter: { filter, value } };
}

// eslint-disable-next-line camelcase
export function additiveFieldBoost(field_boost, value) {
  return { add: { field_boost, value } };
}

export const GEO_META_BOOST_REGION_INSIDE = 'INSIDE';
export const GEO_META_BOOST_REGION_OUTSIDE = 'OUTSIDE';

// eslint-disable-next-line camelcase
export function geoMetaBoost(field_lat, field_lng, lat, lng, radius, value, region) {
  return { geo: { field_lat, field_lng, lat, lng, radius, value, region } };
}

export function pointValue(point, value) {
  return { point, value };
}

export function intervalFieldBoost(field, points) {
  return { interval: { field, points } };
}

export function distanceFieldBoost(min, max, ref, field, value) {
  return { distance: { min, max, ref, field, value } };
}

export function elementFieldBoost(field, elts) {
  return { element: { field, elts } };
}

export function textFieldBoost(field, text) {
  return { text: { field, text } };
}

/* Sort */

export const SORT_ASCENDING = 'ASC';
export const SORT_DESCENDING = 'DESC';

export function sort(field, order) {
  return { field, order };
}

export function transform(identifier) {
  return { identifier };
}

/* Query */

export class Query {

  // Constructor sets some sane defaults
  constructor() {
    this.resetID();
    this.q = {
      page: 1,
      max_results: 10,
    };
  }

  resetID() {
    this.i = '';
    this.s = 0;

    // Generate a random id for the query
    for (let i = 0; i < 16; i++) {
      this.i += 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36));
    }
  }

  // Results per page is a number
  resultsPerPage(results) {
    this.q.results_per_page = results;
  }

  // Page is a number
  page(page) {
    this.q.page = page;
  }

  // Body is a list of Body objects
  // eslint-disable-next-line no-shadow
  body(body) {
    this.q.body = body;
  }

  // Fields is a list of strings
  fields(fields) {
    this.q.fields = fields;
  }

  // Filter is a single Filter object
  filter(filter) {
    this.q.filter = filter;
  }

  // Field boosts is a list of FieldBoost objects
  fieldBoosts(boosts) {
    this.q.field_boosts = boosts;
  }

  // Instance boosts is a list of InstancBoost objectss
  instanceBoosts(boosts) {
    this.q.instance_boosts = boosts;
  }

  // Aggregates is a list of Aggregate Objects
  aggregates(aggregates) {
    const newAggregates = {};
    for (let i = 0; i < aggregates.length; i++) {
      newAggregates[aggregates[i][0]] = aggregates[i][1];
    }
    this.q.aggregates = newAggregates;
  }

  sort(sorts) {
    this.q.sort = sorts;
  }

  // Transforms is a list of strings
  transforms(transforms) {
    this.q.transforms = transforms;
  }
}

/* Base64 encoding */

const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/* eslint-disable */
function _utf8_encode(string) {
  string = string.replace(/\r\n/g,'\n');
  var utftext = '';

  for (var n = 0; n < string.length; n++) {
    var c = string.charCodeAt(n);

    if (c < 128) {
      utftext += String.fromCharCode(c);
    } else if((c > 127) && (c < 2048)) {
      utftext += String.fromCharCode((c >> 6) | 192);
      utftext += String.fromCharCode((c & 63) | 128);
    } else {
      utftext += String.fromCharCode((c >> 12) | 224);
      utftext += String.fromCharCode(((c >> 6) & 63) | 128);
      utftext += String.fromCharCode((c & 63) | 128);
    }
  }

  return utftext;
}

function encode(input) {
  let output = '';
  let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  let i = 0;

  input = _utf8_encode(input);

  while (i < input.length) {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);

    enc1 = chr1 >> 2;
    enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    enc4 = chr3 & 63;

    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }

    output = output + b64.charAt(enc1) + b64.charAt(enc2) + b64.charAt(enc3) + b64.charAt(enc4);
  }

  return output;
}
