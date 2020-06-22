/* eslint-disable react/prop-types */

import { Flex, Label, Text } from '@sajari-ui/core';

const Checkbox = ({ label, id, checked, disabled, onInput, count, value, ...rest }) => {
  return (
    <Flex alignItems="items-start" fontSize="text-sm" {...rest}>
      <Flex alignItems="items-center">
        &#8203;
        <input
          id={id}
          type="checkbox"
          className="w-4 h-4 text-blue-500 form-checkbox disabled:bg-gray-300 disabled:border-gray-400"
          checked={checked}
          disabled={disabled}
          onInput={onInput}
          value={value}
        />
      </Flex>

      <Label htmlFor={id} display="inline-flex" alignItems="items-center" margin="ml-2" textColor="text-gray-700">
        {label}
      </Label>

      {count && (
        <Text as="span" margin="ml-auto" fontSize="text-sm" textColor="text-gray-400">
          {count}
        </Text>
      )}
    </Flex>
  );
};

export default Checkbox;
