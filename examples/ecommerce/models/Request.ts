import is from '../utils/is';
import { replaceAll } from '../utils/string';

const escape = (input = '') => {
  let escaped = input;
  const chars = [','];

  chars.forEach((c) => {
    escaped = replaceAll(input, c, `\\${c}`);
  });

  return escaped;
};

export default class Request {
  query: string;
  page: number;
  pageSize: number;
  count: string[];
  buckets: Record<string, any>;
  filters: Record<string, string[]>;
  parameters: Record<string, any>;
  filter: any;
  sort: any;

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

  set facets(facets: any) {
    this.count = facets
      .filter(({ buckets }: { buckets: any }) => is.empty(buckets))
      .map(({ field }: { field: any }) => field);
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
