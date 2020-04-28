/* eslint-disable react/prop-types */
import classnames from 'classnames';

import is from '../../utils/is';

const Suggestions = ({ items = [], inputValue, highlightedIndex, open, getItemProps, ...rest }) => (
  <ul
    className={classnames(
      { hidden: !open || is.empty(items) },
      'absolute',
      'left-0',
      'right-0',
      'z-20',
      'p-2',
      'mt-2',
      'bg-white',
      'border',
      'rounded-md',
      'shadow',
    )}
    {...rest}
  >
    {items.map((item, index) => (
      <li
        className={classnames(
          'block',
          'w-full',
          'px-4',
          'py-2',
          'leading-5',
          'text-left',
          'rounded',
          'transition',
          'transition-all',
          {
            'bg-blue-500 text-white': highlightedIndex === index,
            'text-gray-700': highlightedIndex !== index,
          },
        )}
        {...getItemProps({
          key: item,
          index,
          item,
        })}
      >
        {item}
      </li>
    ))}
  </ul>
);

export default Suggestions;
