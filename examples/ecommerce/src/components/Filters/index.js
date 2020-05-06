/* eslint-disable react/prop-types */
import { Fragment } from 'preact';

import is from '../../utils/is';
import Filter from './Filter';
import filterTypes from './types';

const Filters = ({ aggregates, facets, filters, query, onChange }) => {
  if (is.empty(facets) || is.empty(aggregates)) {
    return null;
  }

  return (
    <Fragment>
      {facets.map(({ field, sort, title, type = filterTypes.list, transform }) => (
        <Filter
          field={field}
          title={title}
          type={type}
          items={aggregates[field].count}
          values={filters[field]}
          query={query}
          sort={sort}
          transform={transform}
          onChange={onChange}
        />
      ))}
    </Fragment>
  );
};

export default Filters;
