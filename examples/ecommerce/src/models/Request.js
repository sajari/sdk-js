import is from '../utils/is';
import { replaceAll } from '../utils/string';

const escape = (input = '') => {
  let escaped = input;
  const chars = [','];

  chars.forEach((c) => {
    escaped = replaceAll(input, c, `\${char}`);
  });

  return escaped;
};

export default class Request {
  constructor(query = '') {
    this.query = query;
    this.page = 1;
    this.pageSize = 15;
    this.count = [];
    this.buckets = {};
    this.filters = {};
    this.parameters = {};
    this.filter = null;
  }

  set facets(facets) {
    this.count = facets.filter(({ buckets }) => is.empty(buckets)).map(({ field }) => field);
  }

  get countFilters() {
    return this.count
      .map((key) => {
        if (!Object.keys(this.filters).includes(key)) {
          return '';
        }

        const values = this.filters[key];

        if (is.empty(values)) {
          return '';
        }

        const braces = values.length > 1;
        const array = key === 'imageTags';

        return values
          .map((v) => (array ? `${key} ~ ['${v}']` : `${key} = '${v}'`))
          .map((v) => escape(v))
          .map((v) => (braces ? `(${v})` : v))
          .join(' OR ');
      })
      .filter((f) => f !== null);
  }

  serialize = () => ({
    q: this.query,
    filter: !is.empty(this.filter) ? this.filter : '_id != ""',
    page: this.page.toString(),
    resultsPerPage: this.pageSize.toString(),
    fields: '',
    count: this.count.toString(),
    countFilters: this.countFilters.toString(),
    buckets: Object.entries(this.buckets)
      .map(([key, filter]) => `${key}:${filter}`)
      .toString(),
    sort: this.sort,
    ...this.parameters,
  });
}
