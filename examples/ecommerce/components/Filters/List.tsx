import { Button } from '@sajari-ui/core';
import { Fragment, useEffect, useState } from 'react';

import is from 'utils/is';
import { formatNumber } from 'utils/number';
import { sliceObject, sortObject } from 'utils/object';
import { toKebabCase, transformCase } from 'utils/string';
import Checkbox, { CheckboxProps } from '../Checkbox';
import Rating from '../Rating';
import Header, { HeaderProps } from './Header';
import filterTypes, { FilterItems } from './types';

const formatLabel = (label: string, type: number, transform?: string) => {
  switch (type) {
    case filterTypes.price:
      if (label.includes(' - ')) {
        return label
          .split(' - ')
          .map(Number)
          .map((p) => formatNumber(p, 'USD', true))
          .join(' - ');
      }

      if (label.startsWith('> ') || label.startsWith('< ')) {
        const prefix = label.startsWith('< ') ? 'Under' : 'Over';
        return `${prefix} ${formatNumber(Number(label.substring(2)), 'USD', true)}`;
      }

      return label;

    case filterTypes.rating:
      return <Rating id="filter" value={Number(label)} />;

    default:
      return transformCase(label, transform);
  }
};

export interface ListProps extends Pick<CheckboxProps, 'onChange'>, Pick<HeaderProps, 'onReset'> {
  query: string;
  items: FilterItems;
  values: string[];
  sort?: boolean;
  title: string;
  transform?: string;
  type: number;
}

interface ListState {
  query: string;
  expanded: boolean;
}

export default function List(props: ListProps) {
  const { query } = props;
  const [state, setState] = useState({
    expanded: false,
    query,
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, expanded: false }));
  }, [query]);

  const toggleExpanded = () => {
    setState((prev) => ({
      ...prev,
      expanded: !prev.expanded,
    }));
  };

  const { values, items, sort, title, transform, type, onChange, onReset } = props;
  const { expanded } = state;

  if (!items) {
    return null;
  }

  const count = Object.keys(items).length;

  if (count === 0) {
    return null;
  }

  const limit = 8;
  const slice = count > limit;
  const sorted = sort ? sortObject(items, false, 'count', values) : items;
  const sliced = slice && !expanded ? sliceObject(sorted, 0, 8) : sorted;
  const filtered = !is.empty(values);

  return (
    <Fragment>
      <Header title={title} filtered={filtered} onReset={onReset} />

      <div id={`list-${type}`}>
        {Object.entries(sliced).map(([name, { value, count }], index) => {
          const id = `${type}-${toKebabCase(value)}-${index}`;
          const checked = filtered && values.includes(value);

          return (
            <Checkbox
              label={formatLabel(name, type, transform)}
              id={id}
              key={id}
              value={value}
              checked={checked}
              count={formatNumber(count)}
              className={type === filterTypes.rating ? 'items-center mb-1' : 'mb-1'}
              onChange={onChange}
            />
          );
        })}
      </div>

      {slice && (
        <Button
          type="button"
          appearance="link"
          spacing="none"
          onClick={toggleExpanded}
          aria-controls={`list-${type}`}
          aria-expanded={expanded}
          iconAfter={expanded ? 'small-chevron-up' : 'small-chevron-down'}
          fontSize="text-sm"
        >
          {expanded ? `Show less` : `Show ${count - limit} more`}
        </Button>
      )}
    </Fragment>
  );
}
