import env from '../../sajari.config';
import is from './is';
import { parseUrl } from './url';

const { facets } = env;

const params = {
  query: 'q',
  page: 'p',
  pageSize: 'ps',
  sort: 's',
};

let win = {};

if (typeof window !== 'undefined') {
  win = window;
}

const { history, location } = win;
const historySupported = history && history.pushState;

export function parseStateFromUrl({ defaults }) {
  if (!location) {
    return {};
  }

  const url = parseUrl(location.href);
  const state = Object.entries({ ...params, ...facets.map((f) => f.field) })
    .filter(([, param]) => url.searchParams.has(param))
    .reduce(
      (state, [prop, param]) => {
        const value = url.searchParams.get(param);

        // Filters are flattened into the URL
        if (facets.some((f) => f.field === param)) {
          state.filters[param] = value.split(',');
          return state;
        }

        switch (param) {
          case params.page:
          case params.pageSize:
            state[prop] = Number(value);
            break;

          default:
            state[prop] = value;
        }

        return state;
      },
      { ...defaults, filters: {} },
    );

  return state;
}

export function setStateToUrl({ state, replace, defaults }) {
  if (!historySupported || !location) {
    return;
  }

  const url = parseUrl(location.href);
  const { filters, page, pageSize, query, sort } = state;
  const data = {
    query,
    page,
    pageSize,
    sort,
    ...facets.reduce((out, { field }) => Object.assign(out, { [field]: filters[field] }), {}),
  };

  Object.entries(data).forEach(([key, value]) => {
    const param = Object.keys(params).includes(key) ? params[key] : key;
    const isDefault = value === defaults[key];

    if (isDefault || is.empty(value)) {
      url.searchParams.delete(param);
    } else {
      url.searchParams.set(param, value);
    }
  });

  // Update state
  history[replace ? 'replaceState' : 'pushState'](null, null, `${url.pathname}${url.search}${url.hash}`);
}
