import './app.css';

import { Client, DefaultSession, InteractiveSession, TrackingType } from '@sajari/sdk-js';
import classnames from 'classnames';
import { Component, Fragment } from 'preact';

import env from '../sajari.config';
import Button, { buttonSizes, buttonStyles } from './components/Button';
import Filters from './components/Filters';
import Checkbox from './components/Forms/Checkbox';
import Input from './components/Forms/Input';
import Label from './components/Forms/Label';
import Select from './components/Forms/Select';
import { IconGrid, IconList, Logomark } from './components/Icons';
import MenuToggle from './components/MenuToggle';
import Message from './components/Message';
import Pagination from './components/Pagination';
import Results from './components/Results';
import SearchInput from './components/Search/Input';
import Request from './models/Request';
import { parseStateFromUrl, setStateToUrl } from './utils/history';
import { formatNumber } from './utils/number';
import { toSentenceCase } from './utils/string';

const { project, collection, pipeline, version, endpoint, facets, display, tracking } = env;

const defaults = {
  pageSize: 15,
  page: 1,
  query: '',
};

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ...defaults,
      filters: {},
      init: true,
      results: null,
      aggregates: null,
      totalResults: 0,
      time: 0,
      error: null,

      // Options
      sort: null,
      instant: true,
      grid: display && display === 'grid',
      suggest: false,
      suggestions: [],
      settingsShown: false,
      menuOpen: false,

      // Pipeline
      pipeline,
      version,
    };
  }

  componentDidMount() {
    this.client = new Client(project, collection, endpoint);
    this.session = new InteractiveSession('q', new DefaultSession(TrackingType.Click, tracking.field, {}));

    this.updatePipeline();

    this.parseHistory();

    this.listeners(true);
  }

  componentWillUnmount() {
    this.listeners(false);
  }

  listeners = (toggle) => {
    const method = toggle ? 'addEventListener' : 'removeEventListener';

    window[method]('popstate', this.parseHistory, false);
  };

  setHistory = (replace) => setStateToUrl({ state: this.state, replace, defaults });

  parseHistory = () => this.setState(parseStateFromUrl({ defaults }), () => this.search(false));

  updatePipeline = () => {
    const { pipeline, version } = this.state;

    this.pipeline = {
      main: this.client.pipeline(pipeline, version),
      autocomplete: this.client.pipeline('autocomplete'),
    };
  };

  getSuggestions = (query) => {
    const request = new Request(query);
    const suggestionsKey = 'q.suggestions';
    const getSuggestions = (values) => (values && values[suggestionsKey] ? values[suggestionsKey].split(',') : []);

    this.pipeline.autocomplete
      .search(request.serialize(), this.session.next(request.serialize()))
      .then(([, values]) => {
        this.setState({
          suggestions: getSuggestions(values).slice(0, 10),
        });
      });
  };

  search = (setHistory = true, delayHistory = false) => {
    const { filters, page, pageSize, query, sort } = this.state;
    const request = new Request(query);
    request.filters = filters;
    request.pageSize = pageSize;
    request.page = page;
    request.facets = facets.map((f) => f.field);

    if (sort) {
      request.sort = sort;
    }

    // Hide the suggestions and error
    this.setState({
      error: null,
    });

    let results = null;
    let time = 0;
    let totalResults = 0;
    let aggregates = null;

    this.pipeline.main
      .search(request.serialize(), this.session.next(request.serialize()))
      .then(([response]) => {
        if (response) {
          ({ aggregateFilters: aggregates, results, time, totalResults } = response);
        }

        clearTimeout(this.renderTimer);

        // Delay slightly longer if no results so if someone is typing they don't get a flash of no results
        const delay = results.length > 0 ? 20 : 500;

        this.renderTimer = setTimeout(
          () =>
            this.setState({
              aggregates,
              time,
              totalResults,
              results,
              init: false,
            }),
          delay,
        );

        if (setHistory) {
          clearTimeout(this.historyTimer);
          this.historyTimer = setTimeout(this.setHistory, delayHistory ? 1000 : 0);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Query failed', { ...request.serialize() });
        this.setState({ aggregates, time, totalResults, results, init: false, error });
      });
  };

  handleInput = (value, isSelect = false) => {
    const { instant, query, suggest } = this.state;
    const search = instant || isSelect;

    // Already have results for this query
    if (query === value) {
      return;
    }

    // This method gets called twice when instant is enabled
    if (instant && isSelect) {
      return;
    }

    // If we only need to update suggestions
    if (instant || !search) {
      if (suggest && !isSelect) {
        this.getSuggestions(value);
      }

      if (!search) {
        return;
      }
    }

    // Perform a full search
    this.setState(
      {
        query: value,
        // Reset page on new query
        page: 1,
      },
      () => {
        clearTimeout(this.inputTimer);
        this.inputTimer = setTimeout(() => this.search(true, instant), 30);
      },
    );
  };

  toggleSuggest = (event) => {
    const { checked } = event.target;

    this.setState({
      suggest: checked,
      suggestions: [],
    });
  };

  toggleInstant = (event) => {
    const { checked } = event.target;

    this.setState({
      instant: checked,
    });
  };

  toggleGrid = (toggle) => {
    const { grid } = this.state;

    if (toggle === grid) {
      return;
    }

    this.setState({
      grid: toggle,
    });
  };

  setSorting = (event) => {
    const { value } = event.target;

    this.setState(
      {
        sort: value,
      },
      () => this.search(),
    );
  };

  setPageSize = (event) => {
    const { value } = event.target;

    this.setState(
      {
        pageSize: Number(value),
        page: 1,
      },
      () => this.search(),
    );
  };

  setPage = (page) => {
    window.scrollTo({ top: 0 });

    this.setState(
      {
        page,
      },
      () => this.search(),
    );
  };

  clearFilters = () => {
    this.setState(
      {
        filters: {},
        page: 1,
      },
      () => this.search(),
    );
  };

  setFilter = ({ field, values }) => {
    const { filters } = this.state;

    Object.assign(filters, {
      [field]: values,
    });

    this.setState(
      {
        filters,
        page: 1,
      },
      () => this.search(),
    );
  };

  setPipeline = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    this.setState(
      {
        pipeline: formData.get('pipeline'),
        version: formData.get('version'),
      },
      () => {
        this.updatePipeline();

        this.search();
      },
    );
  };

  toggleSettingsShown = () => {
    const { settingsShown } = this.state;

    this.setState({
      settingsShown: !settingsShown,
    });
  };

  toggleMenu = () => {
    const { menuOpen } = this.state;

    this.setState({
      menuOpen: !menuOpen,
    });
  };

  renderSidebar = () => {
    const {
      aggregates,
      filters,
      instant,
      query,
      settingsShown,
      menuOpen,
      pipeline,
      results,
      suggest,
      version,
    } = this.state;
    const hasResults = results && results.length > 0;

    if (!hasResults) {
      return null;
    }

    return (
      <aside
        className={classnames(
          { hidden: !menuOpen },
          'fixed',
          'inset-0',
          'z-40',
          'w-full',
          'h-full',
          'pt-20',
          '-mb-20',
          'bg-white',
          'border-b',
          'border-gray-200',
          'lg:block',
          'lg:-mb-0',
          'lg:static',
          'lg:h-auto',
          'lg:border-r',
          'lg:pt-0',
          'lg:w-80',
        )}
      >
        <div className="h-full overflow-y-auto scrolling-touch bg-white lg:overflow-y-visible lg:h-auto lg:block lg:relative lg:sticky lg:top-20 lg:bg-transparent">
          <nav className="px-6 pt-6 overflow-y-auto text-base lg:text-sm lg:p-0 lg:pl-1 lg:pr-12 lg:pt-8 lg:h-(screen-20)">
            <div className="mb-6 lg:hidden">
              <h2 className="mb-2 text-xs font-medium text-gray-400 uppercase">Options</h2>

              <Checkbox id="suggest-sm" label="Suggestions" onInput={this.toggleSuggest} checked={suggest} />

              <Checkbox
                id="instant-sm"
                label="Instant"
                className="mt-1"
                onInput={this.toggleInstant}
                checked={instant}
              />
            </div>

            <Filters
              facets={facets}
              aggregates={aggregates}
              filters={filters}
              query={query}
              onChange={this.setFilter}
            />

            <form onSubmit={this.setPipeline} className="mb-6">
              <div className="flex items-center mb-2">
                <h2 className="text-xs font-medium text-gray-400 uppercase">Pipeline</h2>
                <button
                  type="button"
                  onClick={this.toggleSettingsShown}
                  className="ml-auto text-xs text-blue-500 uppercase"
                >
                  {!settingsShown ? 'Show' : 'Hide'}
                </button>
              </div>

              <div hidden={!settingsShown}>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="pipeline" className="block mb-2 text-sm text-gray-500">
                      Pipeline
                    </Label>
                    <Input id="pipeline" name="pipeline" value={pipeline} />
                  </div>
                  <div>
                    <Label htmlFor="version" className="block mb-2 text-sm text-gray-500">
                      Version
                    </Label>
                    <Input id="version" name="version" type="number" value={version} />
                  </div>
                </div>

                <Button type="submit" block style={buttonStyles.primary} className="mt-4">
                  Save
                </Button>
              </div>
            </form>
          </nav>
        </div>
      </aside>
    );
  };

  renderResults = () => {
    const { grid, page, pageSize, results, sort, totalResults, time } = this.state;

    return (
      <Fragment>
        <div className="flex items-center justify-end mb-8 lg:mb-6">
          <p className="flex-1 text-sm text-gray-600">
            {`${formatNumber(totalResults)} results`}
            <span className="hidden md:inline">{` (${time} secs)`}</span>
          </p>

          <div className="flex items-center justify-end pl-4 ml-auto">
            <div className="lg:flex lg:items-center">
              <Label htmlFor="sorting" className="mr-2 text-sm text-gray-400">
                Sort by
              </Label>
              <Select id="sorting" small onChange={this.setSorting} value={sort}>
                <option value="">Most Relevant</option>
                <option value="-price">Price: High to Low</option>
                <option value="price">Price: Low to High</option>
                <option value="-rating">Rating: High to Low</option>
                <option value="rating">Rating: Low to High</option>
                <option value="popularity">Popularity</option>
                <option value="bestSellingRank">Best Seller</option>
              </Select>
            </div>

            <div className="items-center hidden ml-2 ml-6 lg:flex">
              <Label htmlFor="page-size" className="mr-2 text-sm text-gray-400">
                Size
              </Label>
              <Select
                id="page-size"
                className="py-1 pl-2 pr-6 text-sm border-gray-200 form-select form-select--small"
                onChange={this.setPageSize}
                value={pageSize}
              >
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>

            <div className="items-center hidden ml-2 ml-6 lg:flex">
              <span className="mr-2 text-sm text-gray-400">View</span>

              <span className="inline-flex flex-no-wrap items-center">
                <Button
                  className={classnames('rounded-l', grid ? 'z-10' : 'focus:z-10')}
                  rounded={false}
                  size={buttonSizes.small}
                  pressed={grid}
                  onClick={() => this.toggleGrid(true)}
                >
                  <IconGrid />
                  <span className="sr-only">Grid view</span>
                </Button>

                <Button
                  className={classnames('-ml-px', 'rounded-r', !grid ? 'z-10' : 'focus:z-10')}
                  rounded={false}
                  size={buttonSizes.small}
                  pressed={!grid}
                  onClick={() => this.toggleGrid(false)}
                >
                  <IconList />
                  <span className="sr-only">List view</span>
                </Button>
              </span>
            </div>
          </div>
        </div>

        <Results results={results} grid={grid} />

        <div className="sticky bottom-0 p-4 pt-2 -mx-8 lg:p-6 lg:mx-0">
          <Pagination totalResults={totalResults} pageSize={pageSize} page={page} onChange={this.setPage} />
          <div className="absolute inset-0 z-0 opacity-25 bg-gradient-b-white" aria-hidden="true" />
        </div>
      </Fragment>
    );
  };

  render() {
    const { error, filters, init, instant, menuOpen, query, results, suggest, suggestions } = this.state;
    const hasResults = results && results.length > 0;

    return (
      <Fragment>
        <div className="box-content fixed inset-x-0 top-0 z-50 flex items-center h-16 py-2 border-b border-gray-200 shadow-sm bg-gray-50">
          <div className="relative w-full max-w-screen-xl px-4 mx-auto lg:px-6">
            <div className="flex items-center">
              <Logomark className="mr-4 lg:mr-6" />

              <h1 className="sr-only">Sajari JavaScript SDK Demo</h1>

              <div className="flex-1 lg:flex lg:items-center">
                <SearchInput
                  id="q"
                  value={query}
                  instant={instant}
                  onInput={this.handleInput}
                  items={suggest ? suggestions : undefined}
                  suggest={suggest}
                  autofocus
                />

                {!instant && (
                  <Button
                    type="button"
                    className="hidden ml-2 md:inline-flex"
                    onClick={this.search}
                    style={buttonStyles.primary}
                  >
                    Search
                  </Button>
                )}

                <div className="items-center hidden ml-3 md:ml-6 lg:flex">
                  <Checkbox id="suggest" label="Suggestions" onInput={this.toggleSuggest} checked={suggest} />

                  <Checkbox
                    id="instant"
                    label="Instant"
                    className="ml-4"
                    onInput={this.toggleInstant}
                    checked={instant}
                  />
                </div>
              </div>

              <MenuToggle open={menuOpen} onClick={this.toggleMenu} />
            </div>
          </div>
        </div>

        <div className="w-full max-w-screen-xl px-6 mx-auto">
          <div className="lg:flex">
            {!init && this.renderSidebar()}

            <main className="w-full min-h-screen pt-24 lg:pl-10 lg:static lg:max-h-full lg:overflow-visible lg:flex-1 lg:pt-28 ">
              {!hasResults && !error && !init && (
                <div className="text-center">
                  <Message title="No results" message={`Sorry, we couldn't find any matches for '${query}'.`} />

                  {filters && Object.keys(filters).length > 0 && (
                    <Button style={buttonStyles.primary} onClick={this.clearFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>
              )}

              {error && <Message type="error" title="Error" message={toSentenceCase(error.message)} />}

              {hasResults && this.renderResults()}
            </main>
          </div>
        </div>
      </Fragment>
    );
  }
}
