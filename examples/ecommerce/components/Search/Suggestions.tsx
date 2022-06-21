import classnames from 'classnames';
import { Fragment } from 'react';
import { UseComboboxGetItemPropsOptions, UseComboboxGetMenuPropsOptions, GetPropsCommonOptions } from 'downshift';

import is from 'utils/is';

interface Props extends React.HTMLProps<HTMLUListElement> {
  items: string[];
  inputValue: string;
  highlightedIndex: number;
  getItemProps: (options: UseComboboxGetItemPropsOptions<string>) => any;
  getMenuProps: (options?: UseComboboxGetMenuPropsOptions, otherOptions?: GetPropsCommonOptions) => any;
}

const Suggestions = ({
  items = [],
  inputValue,
  highlightedIndex,
  open,
  getItemProps,
  getMenuProps,
  ...rest
}: Props) => {
  // Highlight the suggested text rather than their input
  // https://baymard.com/blog/autocomplete-design#7-highlight-the-active-suggestion-desktop-specific
  const highlighter = (item: string, selected: boolean) => {
    if (item.startsWith(inputValue)) {
      return (
        <Fragment>
          {inputValue}
          <span className={classnames('font-semibold', !selected ? 'text-gray-900' : '')}>
            {item.replace(inputValue, '')}
          </span>
        </Fragment>
      );
    }

    return item;
  };

  return (
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
        'rounded-lg',
        'shadow',
      )}
      {...getMenuProps()}
      {...rest}
    >
      {items.map((item, index) => {
        const selected = highlightedIndex === index;

        return (
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
              'duration-50',
              {
                'bg-blue-500 text-white': selected,
                'text-gray-500': !selected,
              },
            )}
            {...getItemProps({
              key: item,
              index,
              item,
            })}
            aria-label={item}
          >
            {highlighter(item, selected)}
          </li>
        );
      })}
    </ul>
  );
};

export default Suggestions;
