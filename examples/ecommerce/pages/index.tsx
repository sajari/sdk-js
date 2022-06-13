import type { NextPage } from 'next';
import Head from 'next/head';

import {
  Button,
  ButtonGroup,
  Heading,
  IconButton,
  Label,
  Logomark,
  Pagination,
  Select,
  Text,
  TextInput,
  VisuallyHidden,
} from '@sajari-ui/core';
import { Aggregates, Client, CountAggregate, DefaultSession, InteractiveSession, TrackingType } from '@sajari/sdk-js';
import classnames from 'classnames';
import { ChangeEvent, Fragment } from 'react';

import env from 'config/sajari.config';
import Checkbox from 'components/Checkbox';
import Filters from 'components/Filters';
import MenuToggle from 'components/MenuToggle';
import Message from 'components/Message';
import Parameters from 'components/Parameters';
import Results from 'components/Results';
import Combobox from 'components/Search/Combobox';
import Request from 'models/Request';
import { parseStateFromUrl, setStateToUrl } from 'utils/history';
import is from 'utils/is';
import { formatNumber } from 'utils/number';
import { toSentenceCase } from 'utils/string';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Facet } from 'components/Filters/types';

const {
  projectId,
  collectionId,
  pipelineName,
  pipelineVersion,
  endpoint,
  facets,
  buckets,
  display,
  tracking,
  parameters,
} = env;

const defaults = {
  pageSize: 15,
  page: 1,
  query: '',
};

let time = 0;
let totalResults = 0;
let aggregates: any[];
let aggregateFilters: any[];

interface SearchState {
  filters: Record<string, any>;
  init: boolean;
  results: null | any[];
  aggregates: Aggregates | null;
  aggregateFilters: Record<string, CountAggregate> | null;
  totalResults: number;
  time: number;
  page: number;
  pageSize: number;
  query: string;
  sort: any;
  error: any;
  instant: boolean;
  grid: boolean;
  suggest: boolean;
  suggestions: any[];
  menuOpen: boolean;
  pipelineName: string;
  pipelineVersion: string;
  parameters: any;
}

const Home: NextPage = () => {
  const [state, setInternalState] = useState<SearchState>({
    ...defaults,
    filters: {},
    init: true,
    results: null,
    aggregates: null,
    aggregateFilters: null,
    totalResults: 0,
    time: 0,
    error: null,

    // Options
    sort: null,
    instant: true,
    grid: display === 'grid',
    suggest: false,
    suggestions: [],
    menuOpen: false,

    // Pipeline
    pipelineName,
    pipelineVersion,

    // Parameters
    parameters,

    // Merge state from URL
    ...parseStateFromUrl({ defaults }),
  });

  const setState = useCallback((values: any, callback?: Function) => {
    setInternalState((prev: any) => ({ ...prev, ...values }));
    if (callback) {
      setTimeout(() => callback());
    }
  }, []);

  const client = useMemo(() => new Client(projectId, collectionId, endpoint), []);
  const session = useMemo(
    () => new InteractiveSession('q', new DefaultSession(TrackingType.Click, tracking.field, {})),
    [],
  );
  const pipeline = useRef<any>();
  const renderTimer = useRef<ReturnType<typeof window.setTimeout>>();
  const inputTimer = useRef<ReturnType<typeof window.setTimeout>>();
  const historyTimer = useRef<number>();

  const setBrowserHistory = (replace: boolean) => setStateToUrl({ state, replace, defaults });

  const search = (setHistory = true, delayHistory = false) => {
    const { filters, page, pageSize, parameters, query, sort } = state;
    const request = new Request(query);
    request.filters = filters;
    request.pageSize = pageSize;
    request.page = page;
    request.facets = facets;
    request.buckets = buckets;
    request.parameters = parameters;
    request.filter = Object.entries(filters)
      .filter(([key]) => facets.find(({ field, buckets }: any) => field === key && !is.empty(buckets)))
      .reduce((_, [, values]) => {
        return (values as any).map((v: keyof typeof buckets) => buckets[v]);
      }, [])
      .map((v) => `(${v})`)
      .join(' OR ');

    if (sort) {
      request.sort = sort;
    }

    // Hide the suggestions and error
    setState({
      error: null,
    });

    pipeline.current.main
      .search(request.serialize(), session.next(request.serialize()))
      .then(([response]: any[]) => {
        let results = [];
        if (response) {
          aggregateFilters = response.aggregateFilters;
          aggregates = response.aggregates;
          time = response.time;
          totalResults = response.totalResults;
          results = response.results;
        }

        clearTimeout(renderTimer.current);

        // Delay slightly longer if no results so if someone is typing they don't get a flash of no results
        const delay = results.length > 0 ? 20 : 500;

        renderTimer.current = setTimeout(
          () =>
            setState({
              aggregates,
              aggregateFilters,
              time,
              totalResults,
              results: response.results,
              init: false,
            }),
          delay,
        );

        if (setHistory) {
          clearTimeout(historyTimer.current);
          historyTimer.current = setTimeout(setBrowserHistory, delayHistory ? 1000 : 0);
        }
      })
      .catch((error: any) => {
        console.error('Query failed', JSON.stringify(request.serialize(), null, 2));
        setState({ aggregates, aggregateFilters, time, totalResults, results, init: false, error });
      });
  };

  useEffect(() => {
    updatePipeline();
    search(false);
    listeners(true);

    return () => {
      listeners(false);
    };
  }, []);

  const listeners = (toggle: boolean) => {
    const method = toggle ? 'addEventListener' : 'removeEventListener';

    window[method]('popstate', () => {}, false);
  };

  const updatePipeline = () => {
    const { pipelineName, pipelineVersion } = state;

    pipeline.current = {
      main: client.pipeline(pipelineName, pipelineVersion),
      autocomplete: client.pipeline('autocomplete'),
    };
  };

  const getSuggestions = (query: string) => {
    const request = new Request(query);
    const suggestionsKey = 'q.suggestions';
    const getSuggestions = (values: any) => (values && values[suggestionsKey] ? values[suggestionsKey].split(',') : []);

    pipeline.current.autocomplete
      .search(request.serialize(), session.next(request.serialize()))
      .then(([, values]: any[]) => {
        setState({
          suggestions: getSuggestions(values).slice(0, 10),
        });
      });
  };

  const handleInput = (value: string, isSelect = false) => {
    const { instant, query, suggest } = state;
    const isSearch = instant || isSelect;

    // Already have results for this query
    if (query === value) {
      return;
    }

    // This method gets called twice when instant is enabled
    if (instant && isSelect) {
      return;
    }

    // If we only need to update suggestions
    if (instant || !isSearch) {
      if (suggest && !isSelect) {
        getSuggestions(value);
      }

      if (!isSearch) {
        return;
      }
    }

    // Perform a full search
    setState(
      {
        query: value,
        page: 1,
      },
      () => {
        clearTimeout(inputTimer.current);
        inputTimer.current = setTimeout(() => search(true, instant), 30);
      },
    );
  };

  const handleSubmit = (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    setState(
      {
        query: formData.get('q'),
        page: 1,
      },
      () => {
        search(true);
      },
    );
  };

  const toggleSuggest = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    console.log({ checked });

    setState({
      suggest: checked,
      suggestions: [],
    });
  };

  const toggleInstant = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;

    setState({
      instant: checked,
    });
  };

  const toggleGrid = (toggle: boolean) => {
    const { grid } = state;

    if (toggle === grid) {
      return;
    }

    setState({
      grid: toggle,
    });
  };

  const setSorting = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;

    setState(
      {
        sort: value,
      },
      () => search(),
    );
  };

  const setPageSize = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;

    setState(
      {
        pageSize: Number(value),
        page: 1,
      },
      () => search(),
    );
  };

  const setPage = (page: number) => {
    window.scrollTo({ top: 0 });

    setState(
      {
        page,
      },
      () => search(),
    );
  };

  const clearFilters = () => {
    setState(
      {
        filters: {},
        page: 1,
      },
      () => search(),
    );
  };

  const setFilter = ({ field, values }: any) => {
    const { filters } = state;

    Object.assign(filters, {
      [field]: values,
    });

    setState(
      {
        filters,
        page: 1,
      },
      () => search(),
    );
  };

  const setPipeline = (event: any) => {
    event.preventDefault();

    const formData = new FormData(event.target.form);

    setState(
      {
        pipelineName: formData.get('pipeline-name'),
        pipelineVersion: formData.get('pipeline-version'),
      },
      () => {
        updatePipeline();
        search();
      },
    );
  };

  const toggleMenu = () => {
    const { menuOpen } = state;

    setState({
      menuOpen: !menuOpen,
    });
  };

  const setParameters = (params: any) =>
    setState(
      {
        parameters: params,
      },
      () => search(),
    );

  const renderSidebar = () => {
    const {
      aggregates,
      aggregateFilters,
      filters,
      instant,
      query,
      menuOpen,
      parameters,
      pipelineName,
      pipelineVersion,
      results,
      suggest,
    } = state;
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
        <div className="h-full overflow-y-auto scrolling-touch bg-white lg:overflow-y-visible lg:h-auto lg:block lg:sticky lg:top-20 lg:bg-transparent">
          <nav className="px-6 pt-6 overflow-y-auto text-base lg:text-sm lg:p-0 lg:pl-1 lg:pr-12 lg:pt-8 lg:h-(screen-20)">
            <div className="mb-6 lg:hidden">
              <h2 className="mb-2 text-xs font-medium text-gray-400 uppercase">Options</h2>
              <Checkbox id="suggest-sm" label="Suggestions" onChange={toggleSuggest} checked={suggest} />
              <Checkbox id="instant-sm" label="Instant" className="mt-1" onChange={toggleInstant} checked={instant} />
            </div>

            {aggregates && aggregateFilters && (
              // @ts-ignore
              <Filters
                facets={facets as Facet[]}
                buckets={buckets}
                aggregates={aggregates}
                aggregateFilters={aggregateFilters}
                filters={filters}
                query={query}
                onChange={setFilter}
              />
            )}

            <Parameters parameters={parameters} onChange={setParameters} className="mb-6" />

            <form
              className="mb-6"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setPipeline(event);
                }
              }}
            >
              <Heading as="h2" size="xs" margin="mb-2">
                Pipeline
              </Heading>

              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="pipeline-name" visuallyHidden>
                    Name
                  </Label>
                  <TextInput
                    id="pipeline-name"
                    name="pipeline-name"
                    defaultValue={pipelineName}
                    placeholder="Name"
                    fontSize="text-sm"
                  />
                </div>

                <div className="flex-1">
                  <Label htmlFor="pipeline-version" visuallyHidden>
                    Version
                  </Label>
                  <TextInput
                    id="pipeline-version"
                    name="pipeline-version"
                    defaultValue={pipelineVersion}
                    placeholder="Version"
                    fontSize="text-sm"
                  />
                </div>
              </div>
            </form>
          </nav>
        </div>
      </aside>
    );
  };

  const renderResults = () => {
    const { grid, page, pageSize, results, sort, totalResults, time } = state;

    return (
      <Fragment>
        <div className="flex items-center justify-end mb-8 lg:mb-6">
          <Text dangerouslySetClassName="text-sm text-gray-600">
            {`${formatNumber(totalResults)} results`}
            {
              // @ts-ignore
              <Text as="span" display={['hidden', 'md:inline']}>{` (${time} secs)`}</Text>
            }
          </Text>

          <div className="flex flex-1 items-center justify-end pl-4 ml-auto">
            <div className="lg:flex lg:items-center">
              <Label htmlFor="sorting" fontSize="text-sm" textColor="text-gray-400" margin="mr-2">
                Sort
              </Label>
              <Select
                id="sorting"
                onChange={setSorting}
                value={sort}
                fontSize="text-sm"
                padding={['py-1', 'pl-2', 'pr-4']}
              >
                <option value="">Most Relevant</option>
                <option value="-price">Price: High to Low</option>
                <option value="price">Price: Low to High</option>
                <option value="-rating">Rating: High to Low</option>
                <option value="rating">Rating: Low to High</option>
                <option value="popularity">Popularity</option>
                <option value="bestSellingRank">Best Seller</option>
              </Select>
            </div>

            <div className="ml-6 hidden lg:flex">
              <Label htmlFor="page-size" fontSize="text-sm" textColor="text-gray-400" margin="mr-2">
                Size
              </Label>
              <Select
                id="page-size"
                onChange={setPageSize}
                value={pageSize}
                fontSize="text-sm"
                padding={['py-1', 'pl-2', 'pr-6']}
              >
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>

            <div className="hidden lg:flex items-center ml-6">
              <span className="text-gray-400 mr-2 text-sm">View</span>

              <ButtonGroup attached>
                <IconButton
                  icon="small-grid"
                  label="Grid view"
                  size="xs"
                  appearance={grid ? 'primary' : undefined}
                  padding={['px-3', 'py-2']}
                  onClick={() => toggleGrid(true)}
                />

                <IconButton
                  icon="small-list"
                  label="List view"
                  size="xs"
                  appearance={!grid ? 'primary' : undefined}
                  padding={['px-3', 'py-2']}
                  onClick={() => toggleGrid(false)}
                />
              </ButtonGroup>
            </div>
          </div>
        </div>

        <Results results={results || []} grid={grid} />

        <div className="sticky bottom-0 p-4 pt-2 lg:p-6 -mx-8 lg:mx-0 text-center">
          <Pagination
            position="relative"
            zIndex="z-10"
            totalResults={totalResults}
            pageSize={pageSize}
            page={page}
            onChange={setPage}
          />
          <div
            className="absolute inset-0 z-0 opacity-50 bg-gradient-to-b from-transparent to-white"
            aria-hidden="true"
          />
        </div>
      </Fragment>
    );
  };

  const { error, filters, init, instant, menuOpen, query, results, suggest, suggestions } = state;
  const hasResults = results && results.length > 0;

  return (
    <Fragment>
      <Head>
        <title>Ecommerce demo | search.io</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="flex items-center box-content fixed inset-x-0 top-0 z-50 h-16 py-2 border-b border-gray-200 shadow-sm bg-gray-50 bg-opacity-75 backdrop-blur-1">
        <div className="relative w-full max-w-screen-xl mx-auto px-4 lg:px-6">
          <div className="flex items-center">
            <Logomark size="md" margin={['mr-4', 'lg:mr-6']} />

            <VisuallyHidden as="h1">Search.io Ecommerce Demo</VisuallyHidden>

            <form onSubmit={handleSubmit} className="flex-1 lg:flex lg:items-center">
              <Combobox
                id="q"
                name="q"
                value={query}
                instant={instant}
                onInput={handleInput}
                items={suggest ? suggestions : undefined}
                suggest={suggest}
                autofocus
              />

              {!instant && (
                <Button type="submit" appearance="primary" display={['hidden', 'md:inline-flex']} margin="ml-2">
                  Search
                </Button>
              )}

              <div className="hidden lg:flex items-center ml-3 md:ml-6 space-x-4">
                <Checkbox id="suggest" label="Suggestions" onChange={toggleSuggest} checked={suggest} />
                <Checkbox id="instant" label="Instant" onChange={toggleInstant} checked={instant} />
              </div>
            </form>

            <MenuToggle open={menuOpen} onClick={toggleMenu} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-screen-xl px-6 mx-auto">
        <div className="lg:flex">
          {!init && renderSidebar()}

          <main className="w-full min-h-screen pt-24 lg:pl-10 lg:pt-28 lg:max-h-full lg:flex-1 lg:overflow-visible">
            {!hasResults && !error && !init && (
              <div className="text-center">
                <Message title="No results" message={`Sorry, we couldn't find any matches for '${query}'.`} />

                {filters && Object.keys(filters).length > 0 && (
                  <Button appearance="primary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {error && <Message type="error" title="Error" message={toSentenceCase(error.message)} />}

            {hasResults && renderResults()}
          </main>
        </div>
      </div>
    </Fragment>
  );
};

export default Home;
