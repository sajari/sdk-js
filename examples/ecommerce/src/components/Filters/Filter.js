/* eslint-disable react/prop-types */
import { Component } from 'preact';

import { arrayEquals } from '../../utils/array';
import ColorSwatch from './ColorSwatch';
import List from './List';
import filterTypes from './types';

export default class Filter extends Component {
  constructor(props) {
    super(props);

    const { values = [] } = props;

    this.state = {
      values,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    return arrayEquals(nextProps.values, prevState.values) ? {} : { values: nextProps.values || [] };
  }

  onChange = (event) => {
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
    const values = [];
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
            query={query}
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
