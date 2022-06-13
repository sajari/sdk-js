import env from 'config/sajari.config';
import is from './is';
import { parseUrl } from './url';

const { facets } = env;

interface Params {
  pageSize: number;
  page: number;
  query: string;
  sort?: string;
}

interface State extends Params {
  filters?: Record<string, string[]>;
}

const params = {
  query: 'q',
  page: 'p',
  pageSize: 'ps',
  sort: 's',
};
const arraySeparator = '|';
let win: typeof window | undefined = undefined;

if (typeof window !== 'undefined') {
  win = window;
}

const { history, location } = win ?? {};
const historySupported = history && history.pushState;

export function parseStateFromUrl({ defaults }: { defaults: Params }) {
  if (!location) {
    return { ...defaults } as State;
  }

  const url = parseUrl(location.href);

  if (!url) {
    return { ...defaults } as State;
  }

  const state = Object.entries({ ...params, ...facets.map((f: any) => f.field) })
    .filter(([, param]) => url.searchParams.has(param.toString()))
    .reduce(
      (state, [prop, param]) => {
        const value = url.searchParams.get(param.toString());

        // Filters are flattened into the URL
        if (state.filters && facets.some((f) => f.field === param)) {
          state.filters[param.toString()] = value?.split(arraySeparator) ?? [];
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
      { ...defaults, filters: {} } as State,
    );

  return state;
}

export function setStateToUrl({ state, replace, defaults }) {
  if (!historySupported || !location) {
    return;
  }

  const url = parseUrl(location.href);

  if (!url) {
    return;
  }

  const { filters, page, pageSize, query, sort } = state;
  const data = {
    query,
    page,
    pageSize,
    sort,
    ...facets.reduce((out, { field }) => Object.assign(out, { [field]: filters[field] }), {}),
  };

  Object.entries(data).forEach(([key, value]: [string, any]) => {
    const param = Object.keys(params).includes(key) ? params[key as keyof typeof params] : key;
    const isDefault = value === defaults[key];

    if (isDefault || is.empty(value)) {
      url.searchParams.delete(param);
    } else {
      url.searchParams.set(param, is.array(value) ? value.join(arraySeparator) : value);
    }
  });

  // Update state
  history[replace ? 'replaceState' : 'pushState'](null, null as any, `${url.pathname}${url.search}${url.hash}`);
}
