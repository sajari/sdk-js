import { getGAID } from './utils'

// Api handles the searching of queries and keeping track of query id and sequence
export class Api {

  // constructor takes sajari project and collection details, and an optional address as an override
  constructor(project, collection, address) {
    this.p = project;
    this.c = collection;
    this.a = address || 'https://api.sajari.com:9200/search/';
  }

  // search takes a query, success and error callbacks
  search(query, callback) {
    return fetch(this.a, {
      method: 'POST',
      body: JSON.stringify({
        searchRequest: {
          searchRequest: query.q,
          // eslint-disable-next-line no-param-reassign
          tracking: {
            type: query.generate_tokens,
            field: query.token_key_field,
            sequence: query.s++, // Increment query sequence
            query_id: query.i,
            data: query.data,
          },
        },
        project: this.p,
        collection: this.c,
      })
    }).then((res) => {
      if (res.ok) {
        res.json().then((json) => {
          // Flatten single value / multiple values proto structure
          const r = json.searchResponse.results || []; // Some queries do not have results
          for (let i = 0; i < r.length; i++) {
            for (let f in r[i].values) {
              r[i].values[f] = r[i].values[f].single !== undefined ? r[i].values[f].single : r[i].values[f].repeated.values;
            }
            // Copy tokens into results
            if (json.tokens) {
              r[i].tokens = json.tokens[i];
            }
          }
          // Return searchResponse
          callback(null, json)
        })
      } else {
        res.text().then((errMsg) => callback(errMsg, null));
      }
    }).catch((err) => callback('Error during fetch: ' + err.message, null));
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

function protoValue(values) {
  if (values instanceof Array) {
    return { repeated: { values: values.map(String) } }
  }
  if (values === null) {
    return value = { null: true }
  }
  return { single: String(values) }
}

function operatorFromString(operator) {
  switch (operator) {
  case '=':
    return 'EQUAL_TO'
  case '!=':
    return 'NOT_EQUAL_TO'
  case '>':
    return 'GREATER_THAN'
  case '>=':
    return 'GREATER_THAN_OR_EQUAL_TO'
  case '<':
    return 'LESS_THAN'
  case '<=':
    return 'LESS_THAN_OR_EQUAL_TO'
  case '~':
    return 'CONTAINS'
  case '!~':
    return 'DOES_NOT_CONTAIN'
  case '^':
    return 'HAS_PREFIX'
  case '$':
    return 'HAS_SUFFIX'
  default:
    throw `invalid operator: ${operator}`
  }
}

export function fieldFilter(field, operator, values) {
  return { field: { field, value: protoValue(values), operator: operatorFromString(operator) } };
}

// eslint-disable-next-line camelcase
export function geoFilter(field_lat, field_lng, lat, lng, radius, region) {
  return { geo: { field_lat, field_lng, lat, lng, radius, region } };
}

/* Filter Combinators */


function combinatorFilter(filters, operator) {
  return { combinator: { filters, operator } };
}

export function allFilters(filters) {
  return combinatorFilter(filters, 'ALL')
}

export function anyFilters(filters) {
  return combinatorFilter(filters, 'ANY')
}

export function oneOfFilters(filters) {
  return combinatorFilter(filters, 'ONE')
}

export function noneOfFilters(filters) {
  return combinatorFilter(filters, 'NONE')
}

/* Index Boosts */

export function fieldInstanceBoost(field, value) {
  return { field: { field, value } };
}

export function scoreInstanceBoost(threshold, min_count) {
  return { score: { threshold, min_count } };
}

/* Meta Boosts */

export function filterFieldBoost(filter, value) {
  return { filter: { filter, value } };
}

// eslint-disable-next-line camelcase
export function additiveFieldBoost(field_boost, value) {
  return { additive: { field_boost, value } };
}

export const GEO_FIELD_BOOST_REGION_INSIDE = 'INSIDE';
export const GEO_FIELD_BOOST_REGION_OUTSIDE = 'OUTSIDE';

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

export function sort(field) {
  return { field, order: field[0] === '-' ? 'DESC' : 'ASC' };
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
      results_per_page: 10,
    };
    this.data = {} // tracking data
    const gaID = getGAID()
    if (gaID) {
      this.tracking('gaID', gaID)
    }
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

  // Instance boosts is a list of InstanceBoost objects
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

  // Sets pos neg tracking token field and enables click tracking
  posNegTracking(field) {
    this.generate_tokens = 'POS_NEG';
    this.token_key_field = field;
  }

  // Sets click tracking token field and enables pos neg tracking
  clickTracking(field) {
    this.generate_tokens = 'CLICK';
    this.token_key_field = field;
  }

  // Set tracking data
  tracking(name, value) {
    this.data[name] = value
  }
}
