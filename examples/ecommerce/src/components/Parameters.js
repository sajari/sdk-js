/* eslint-disable react/prop-types */
import { Box, Flex, Heading, IconButton, TextInput } from '@sajari-ui/core';

const Parameter = ({ name = '', value = '', onSubmit }) => (
  <Flex as="form" onSubmit={onSubmit} space="space-x-2">
    <Box flex="flex-1">
      <TextInput name="key" label="Key" value={name} readOnly={name} fontSize="text-sm" />
    </Box>
    <Box flex="flex-1">
      <TextInput name="value" label="Value" value={value} readOnly={name} fontSize="text-sm" />
    </Box>
    <IconButton
      type="submit"
      flexShrink="flex-shrink-0"
      icon={name ? 'close' : 'add'}
      label={name ? 'Remove' : 'Add'}
      fontSize="text-sm"
    />
  </Flex>
);

const Parameters = ({ parameters = {}, onChange, ...rest }) => {
  const params = { ...parameters };

  const getFormData = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    return {
      key: formData.get('key'),
      value: formData.get('value'),
    };
  };

  const add = (event) => {
    const { key, value } = getFormData(event);

    if (!key || !key.length) {
      return;
    }

    onChange(Object.assign(params, { [key]: value }));
  };

  const remove = (event) => {
    const { key } = getFormData(event);
    delete params[key];
    onChange(params);
  };

  return (
    <Box {...rest}>
      <Heading as="h2" size="xs" margin="mb-2">
        Parameters
      </Heading>

      <Box margin="mb-4" space="space-y-2">
        {parameters &&
          Object.entries(params).map(([key, value]) => (
            <Parameter key={key} name={key} value={value} onSubmit={remove} />
          ))}

        <Parameter key="" onSubmit={add} />
      </Box>
    </Box>
  );
};

export default Parameters;
