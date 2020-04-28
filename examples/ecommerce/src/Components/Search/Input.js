/* eslint-disable react/prop-types */
import classnames from 'classnames';
import { useCombobox } from 'downshift';

import is from '../../utils/is';
import Input from '../Forms/Input';
import Label from '../Forms/Label';
import { IconSearch } from '../Icons';
import Suggestions from './Suggestions';

const SearchInput = ({ placeholder = 'Search', id, instant, items = [], onInput, value, ...rest }) => {
  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    selectedItem,
    highlightedIndex,
    inputValue,
    getItemProps,
    getInputProps,
    getComboboxProps,
    openMenu,
  } = useCombobox({
    items,
    selectedItem: value,
    initialIsOpen: !is.empty(items),
    onInputValueChange: ({ inputValue }) => onInput(inputValue),
    onSelectedItemChange: ({ inputValue }) => onInput(inputValue, true),
  });

  return (
    <div className="relative flex-1">
      <div className="relative" {...getComboboxProps()}>
        <Label htmlFor={id} srOnly {...getLabelProps()}>
          {placeholder}
        </Label>

        <Input
          id={id}
          className={classnames('pl-10', 'rounded-full', { 'md:pr-40': !instant })}
          placeholder={placeholder}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          type="search"
          // enterkeyhint="search"
          {...rest}
          {...getInputProps({
            onFocus: openMenu,
          })}
        />

        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <IconSearch className="w-4 h-4 text-gray-400 pointer-events-none fill-current" />
        </div>

        {!instant && (
          <div className="absolute inset-y-0 right-0 items-center hidden pr-4 text-sm text-gray-500 pointer-events-none md:flex">
            Press ⏎ to search
          </div>
        )}
      </div>

      <Suggestions
        open={isOpen}
        items={items}
        getItemProps={getItemProps}
        inputValue={inputValue}
        highlightedIndex={highlightedIndex}
        selectedItem={selectedItem}
        {...getMenuProps()}
      />
    </div>
  );
};

export default SearchInput;
