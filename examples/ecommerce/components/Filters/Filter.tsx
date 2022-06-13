import { Component } from 'react';

import { arrayEquals } from '../../utils/array';
import ColorSwatch, { ColorSwatchProps } from './ColorSwatch';
import List, { ListProps } from './List';
import filterTypes, { FilterItems } from './types';

export interface FilterProps extends Pick<ListProps, 'transform' | 'sort' | 'query'> {
  values: string[];
  items: FilterItems;
  title: string;
  type: number;
  field: string;
  onChange: (value: { field: string; values: string[] }) => void;
}

interface FilterState {
  values: string[];
}

export default class Filter extends Component<FilterProps, FilterState> {
  constructor(props: FilterProps) {
    super(props);

    const { values = [] } = props;

    this.state = {
      values,
    };
  }

  static getDerivedStateFromProps(nextProps: FilterProps, prevState: FilterState) {
    return arrayEquals(nextProps.values, prevState.values) ? {} : { values: nextProps.values || [] };
  }

  onChange: ColorSwatchProps['onChange'] = (event) => {
    const { field, onChange = () => {} } = this.props;
    const { values } = this.state;
    const { checked, value } = event.target;
    const index = values.indexOf(value);

    if (checked && index === -1) {
      values.push(value);
    } else if (!checked && index > -1) {
      values.splice(index, 1);
    }

    this.setState({ values }, () => onChange({ field, values }));
  };

  onReset = () => {
    const { field, onChange = () => {} } = this.props;
    const values: string[] = [];
    this.setState({ values }, () => onChange({ field, values }));
  };

  render() {
    const { items, query, sort, title, transform, type } = this.props;
    const { values } = this.state;

    if (!items || !Object.keys(items).length) {
      return null;
    }

    return (
      <div className="mb-4">
        {type === filterTypes.color && (
          <ColorSwatch
            title={title}
            values={values}
            items={items}
            type={type}
            onChange={this.onChange}
            onReset={this.onReset}
          />
        )}
        {type !== filterTypes.color && (
          <List
            title={title}
            values={values}
            items={items}
            sort={sort}
            type={type}
            query={query}
            transform={transform}
            onChange={this.onChange}
            onReset={this.onReset}
          />
        )}
      </div>
    );
  }
}
