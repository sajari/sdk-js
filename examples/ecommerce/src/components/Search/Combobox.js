/* eslint-disable react/prop-types */
import classnames from 'classnames';
import { useCombobox } from 'downshift';

import is from '../../utils/is';
import Input from '../Forms/Input';
import Label from '../Forms/Label';
import { IconSearch } from '../Icons';
import Suggestions from './Suggestions';

const Combobox = ({ placeholder = 'Search', id, instant, items = [], onInput, suggest, value, ...rest }) => {
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
    initialInputValue: value,
    initialIsOpen: !is.empty(items),
    onInputValueChange: ({ inputValue }) => onInput(inputValue),
    onSelectedItemChange: ({ inputValue }) => onInput(inputValue, true),
  });

  return (
    <div className="relative flex-1">
      <Label htmlFor={id} srOnly {...getLabelProps()}>
        {placeholder}
      </Label>

      <div className="relative" {...getComboboxProps()}>
        <Input
          id={id}
          className={classnames('pl-10', 'rounded-full', { 'md:pr-40': !instant })}
          placeholder={placeholder}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          type="search"
          enterkeyhint="search"
          {...rest}
          {...getInputProps({
            onFocus: openMenu,
            onKeyDown: (event) => {
              if (!instant && event.key === 'Enter') {
                // Let downshift handle selection from suggestions
                if (suggest && highlightedIndex > -1) {
                  return;
                }

                // Prevent Downshift's default 'Enter' behavior.
                event.nativeEvent.preventDownshiftDefault = true;

                // Perform a search
                onInput(inputValue, true);
              }
            },
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
        getMenuProps={getMenuProps}
        inputValue={inputValue}
        highlightedIndex={highlightedIndex}
        selectedItem={selectedItem}
      />
    </div>
  );
};

export default Combobox;
