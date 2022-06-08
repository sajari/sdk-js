/* eslint-disable react/prop-types */
import { Box, Label, SearchInput } from '@sajari-ui/core';
import { useCombobox } from 'downshift';

import is from '../../utils/is';
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
      <Label htmlFor={id} visuallyHidden {...getLabelProps()}>
        {placeholder}
      </Label>

      <Box position="relative" {...getComboboxProps()}>
        <SearchInput
          id={id}
          placeholder={placeholder}
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

        {!instant && (
          <Box
            position="absolute"
            offset={['inset-y-0', 'right-0']}
            display={['hidden', 'md:flex']}
            alignItems="items-center"
            padding="pr-4"
            pointerEvents="pointer-events-none"
            fontSize="text-sm"
            textColor="text-gray-500"
          >
            Press ⏎ to search
          </Box>
        )}
      </Box>

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
