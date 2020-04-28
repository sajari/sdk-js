/* eslint-disable react/prop-types */

import { Fragment } from 'preact';

import { toKebabCase } from '../../utils/string';
import Label from '../Forms/Label';

const allowedColors = {
  White: 'bg-white border-gray-300 outline-shadow',
  Silver: 'bg-gray-300 border-gray-400',
  Black: 'bg-black border-black',
  Pink: 'bg-pink-400 border-pink-500',
  Magenta: 'bg-pink-600 border-pink-700',
  Red: 'bg-red-400 border-red-500',
  Beige: 'bg-orange-200 border-orange-300',
  Orange: 'bg-orange-400 border-orange-500',
  Brown: 'bg-orange-700 border-orange-800',
  Yellow: 'bg-yellow-300 border-yellow-400',
  Green: 'bg-green-400 border-green-500',
  Azure: 'bg-teal-100 border-teal-200',
  Aqua: 'bg-teal-300 border-teal-400',
  Teal: 'bg-teal-400 border-teal-500',
  Turquoise: 'bg-teal-400 border-teal-500',
  Blue: 'bg-blue-400 border-blue-500',
  'Electric blue': 'bg-blue-600 border-blue-700',
  Lilac: 'bg-purple-300 border-purple-400',
  Purple: 'bg-purple-400 border-purple-500',
  Violet: 'bg-purple-600 border-purple-700',
};

const sortColors = (raw) =>
  Object.keys(allowedColors).reduce((obj, key) => {
    if (raw[key]) {
      obj[key] = raw[key];
    }
    return obj;
  }, {});

const filterColors = (raw) => {
  const keys = Object.keys(allowedColors);

  return sortColors(
    Object.keys(raw)
      .filter((key) => keys.includes(key))
      .reduce((obj, key) => {
        const count = raw[key];
        const className = allowedColors[key];
        obj[key] = { count, className };
        return obj;
      }, {}),
  );
};

const ColorSwatch = ({ values, items, title, type, onChange }) => {
  if (!items || !Object.keys(items).length) {
    return null;
  }

  const filtered = filterColors(items);

  if (!Object.keys(filtered).length) {
    return null;
  }

  return (
    <Fragment>
      <h2 className="mb-2 text-xs font-medium text-gray-400 uppercase">{title}</h2>
      <div className="grid grid-cols-7 gap-4 lg:gap-2">
        {Object.entries(filtered).map(([name, { count, className }], index) => {
          const id = `${type}-${toKebabCase(name)}-${index}`;

          return (
            <Label
              htmlFor={id}
              className={`mb-1 rounded w-full h-10 border shadow-sm cursor-pointer lg:w-6 lg:h-6 lg:rounded-full focus-within:shadow-outline ${className} ${
                values.includes(name) ? 'shadow-outline--selected' : ''
              }`}
            >
              <span className="sr-only">{`${name} (${count} items)`}</span>
              <input
                type="checkbox"
                id={id}
                key={id}
                className="sr-only"
                value={name}
                checked={values.includes(name)}
                onChange={onChange}
              />
            </Label>
          );
        })}
      </div>
    </Fragment>
  );
};

export default ColorSwatch;
