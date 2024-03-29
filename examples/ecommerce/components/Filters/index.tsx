import { Aggregates, CountAggregate } from '@sajari/sdk-js';
import { Fragment } from 'react';

import is from 'utils/is';
import Filter from './Filter';
import filterTypes, { Facet } from './types';

interface FiltersProps {
  aggregates: Aggregates;
  aggregateFilters: Record<string, CountAggregate>;
  facets: Facet[];
  filters: Record<string, any>;
  buckets: any;
  onChange: (values: { field: string; values: any }) => void;
  query: string;
}

const Filters = (props: FiltersProps) => {
  const { aggregates, aggregateFilters, facets, filters, ...rest } = props;
  if (is.empty(facets)) {
    return null;
  }

  return (
    <Fragment>
      {facets.map(({ field, buckets, sort, title, type = filterTypes.list, transform }) => {
        let items = {};
        const values = filters[field];

        // Get items from aggregates for regular facets
        if (is.empty(buckets)) {
          const counts = aggregateFilters[field].count;

          if (is.empty(counts)) {
            return null;
          }

          items = Object.entries(counts).reduce(
            (obj, [title, count]) =>
              Object.assign(obj, {
                [title]: {
                  value: title,
                  count,
                },
              }),
            {},
          );
        }
        // Map the bucket types to title / filter format
        else {
          if (!aggregates.buckets) {
            return null;
          }

          items = Object.entries(buckets).reduce(
            (obj, [type, title]) =>
              Object.assign(obj, {
                [title]: {
                  value: type,
                  count: (aggregates.buckets as any).count[type],
                },
              }),
            {},
          );
        }

        return (
          <Filter
            {...rest}
            key={field}
            field={field}
            title={title}
            type={type}
            items={items}
            values={values}
            sort={sort}
            transform={transform}
          />
        );
      })}
    </Fragment>
  );
};

export default Filters;
