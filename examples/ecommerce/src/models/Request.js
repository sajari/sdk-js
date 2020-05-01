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
    this.facets = [];
    this.filters = {};
  }

  get countFilters() {
    return this.facets.map((key) => {
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
    });
  }

  serialize = () => ({
    q: this.query,
    filter: '_id != ""',
    page: this.page.toString(),
    resultsPerPage: this.pageSize.toString(),
    count: this.facets.toString(),
    countFilters: this.countFilters.toString(),
    sort: this.sort,
  });
}
