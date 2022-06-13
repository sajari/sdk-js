import { useEffect, useState } from 'react';

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

export default function Filter(props: FilterProps) {
  const [values, setValues] = useState(props.values || []);

  useEffect(() => {
    const { field, onChange = () => {} } = props;
    onChange({ field, values });
  }, [values, props.field]);

  const onChange: ColorSwatchProps['onChange'] = (event) => {
    const { field, onChange = () => {} } = props;
    const { checked, value } = event.target;
    const newValues = [...values];
    const index = newValues.indexOf(value);

    if (checked && index === -1) {
      newValues.push(value);
    } else if (!checked && index > -1) {
      newValues.splice(index, 1);
    }
    setValues(newValues);
    onChange({ field, values: newValues });
  };

  const onReset = () => {
    setValues([]);
  };

  const { items, query, sort, title, transform, type } = props;

  if (!items || !Object.keys(items).length) {
    return null;
  }

  return (
    <div className="mb-4">
      {type === filterTypes.color && (
        <ColorSwatch title={title} values={values} items={items} type={type} onChange={onChange} onReset={onReset} />
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
          onChange={onChange}
          onReset={onReset}
        />
      )}
    </div>
  );
}
