/* eslint-disable react/prop-types */
import { Fragment } from 'preact';

import is from '../../utils/is';
import Filter from './Filter';
import filterTypes from './types';

const Filters = ({ aggregates, aggregateFilters, facets, filters, ...rest }) => {
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
                  count: aggregates.buckets.count[type],
                },
              }),
            {},
          );
        }

        return (
          <Filter
            field={field}
            title={title}
            type={type}
            items={items}
            values={values}
            sort={sort}
            transform={transform}
            {...rest}
          />
        );
      })}
    </Fragment>
  );
};

export default Filters;
