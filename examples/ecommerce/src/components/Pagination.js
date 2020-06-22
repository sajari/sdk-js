import { Button, ButtonGroup, IconButton } from '@sajari-ui/core';
import PropTypes from 'prop-types';

import { clamp } from '../utils/number';
import { format } from '../utils/string';

const getButtons = (page, pageCount, onChange) => {
  const limit = 5;
  const middle = Math.ceil(limit / 2);
  let offset = 0;

  if (pageCount > limit) {
    if (page < limit) {
      offset = 0;
    } else {
      const max = pageCount - limit;
      offset = clamp(page > max ? max : page - middle, 0, max);
    }
  }

  const items = Array.from(Array(clamp(pageCount, 0, limit))).map((value, index) => Number(index) + offset);

  if (pageCount > limit) {
    // Add the 1 ...
    if (offset > 1) {
      items.unshift(0, null);
    }

    // Add the ... last
    const lastIndex = pageCount - 1;

    if (!items.includes(lastIndex) && pageCount > limit + 2) {
      items.push(null, lastIndex);
    }
  }

  return items.map((index) => {
    if (index === null) {
      return <span className="px-2 py-2 -ml-px border border-gray-200 bg-gray-50">&hellip;</span>;
    }

    const number = index + 1;
    const active = number === page;

    return (
      <Button
        active={active}
        key={index}
        aria-current={active ? 'page' : null}
        aria-label={format('{0}{1}', `Page ${number}`, active ? ', current page' : '')}
        onClick={() => onChange(number)}
      >
        {number}
      </Button>
    );
  });
};

const Pagination = (props) => {
  const { totalResults, pageSize, page, onChange } = props;

  if (totalResults === 0 || pageSize === 0) {
    return null;
  }

  const pageCount = Math.ceil(totalResults / pageSize);
  const hasPrevious = page > 1;
  const hasNext = page < pageCount;

  if (pageCount === 1) {
    return null;
  }

  const changeHandler = (target) => {
    if (target === page) {
      return;
    }

    onChange(clamp(target, 1, pageCount));
  };

  return (
    <nav className="relative z-10 text-center" aria-label="Pagination">
      <ButtonGroup attached boxShadow="shadow-sm">
        <IconButton
          disabled={!hasPrevious}
          onClick={() => (hasPrevious ? changeHandler(page - 1) : {})}
          icon="chevron-left"
          label="Previous"
        />

        {getButtons(page, pageCount, changeHandler)}

        <IconButton
          disabled={!hasNext}
          onClick={() => (hasNext ? changeHandler(page + 1) : {})}
          icon="chevron-right"
          label="Next"
        />
      </ButtonGroup>
    </nav>
  );
};

Pagination.defaultProps = {
  onChange: () => {},
};

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  totalResults: PropTypes.number.isRequired,
  onChange: PropTypes.func,
};

export default Pagination;
