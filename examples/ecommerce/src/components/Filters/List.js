/* eslint-disable react/prop-types */
import { Component, Fragment } from 'preact';

import is from '../../utils/is';
import { formatNumber } from '../../utils/number';
import { sliceObject, sortObject } from '../../utils/object';
import { toKebabCase, transformCase } from '../../utils/string';
import Checkbox from '../Forms/Checkbox';
import Rating from '../Rating';
import Header from './Header';
import filterTypes from './types';

const formatLabel = (label, type, transform) => {
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
      return <Rating value={Number(label)} />;

    default:
      return transformCase(label, transform);
  }
};

export default class List extends Component {
  constructor(props) {
    super(props);

    const { query } = props;

    this.state = {
      expanded: false,
      query,
    };
  }

  componentWillReceiveProps(nextProps) {
    const { query } = this.state;

    if (nextProps.query !== query) {
      this.setState({ expanded: false });
    }
  }

  toggleExpanded = () => {
    const { expanded } = this.state;

    this.setState({
      expanded: !expanded,
    });
  };

  render() {
    const { values, items, sort, title, transform, type, onChange, onReset } = this.props;
    const { expanded } = this.state;

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
                className={`mb-1 ${type === filterTypes.rating ? 'items-center' : ''}`}
                onChange={onChange}
              />
            );
          })}
        </div>

        {slice && (
          <button
            type="button"
            className="text-sm text-blue-500 focus:outline-none focus:text-blue-700"
            onClick={this.toggleExpanded}
            aria-controls={`list-${type}`}
            aria-expanded={expanded}
          >
            {expanded ? `Show less` : `Show ${count - limit} more`}
          </button>
        )}
      </Fragment>
    );
  }
}
