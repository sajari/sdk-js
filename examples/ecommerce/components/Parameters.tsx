/* eslint-disable react/prop-types */
import { Box, BoxProps, Flex, Heading, IconButton, TextInput } from '@sajari-ui/core';
import { FormEvent, FormEventHandler, useState } from 'react';

interface ParameterProps {
  name?: string;
  value?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

const Parameter = ({ name: nameProp, value: valueProp, onSubmit }: ParameterProps) => {
  const [name, setName] = useState(nameProp);
  const [value, setValue] = useState(valueProp);

  const isReadonly = !!nameProp;

  const handleSubmit: typeof onSubmit = (event) => {
    onSubmit(event);
    if (!isReadonly) {
      setName('');
      setValue('');
    }
  };

  return (
    <Flex as="form" onSubmit={handleSubmit} space="space-x-2">
      <Box flex="flex-1">
        <TextInput
          name="key"
          label="Key"
          value={nameProp ?? name}
          onChange={(e) => setName(e.target.value)}
          readOnly={isReadonly}
          fontSize="text-sm"
        />
      </Box>
      <Box flex="flex-1">
        <TextInput
          name="value"
          label="Value"
          value={valueProp ?? value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={isReadonly}
          fontSize="text-sm"
        />
      </Box>
      <IconButton
        type="submit"
        flexShrink="flex-shrink-0"
        icon={isReadonly ? 'close' : 'add'}
        label={isReadonly ? 'Remove' : 'Add'}
        fontSize="text-sm"
      />
    </Flex>
  );
};

interface ParametersProps extends Omit<BoxProps, 'onChange'> {
  parameters: Record<string, string>;
  onChange: (parameters: Record<string, string>) => void;
}

const Parameters = ({ parameters = {}, onChange, ...rest }: ParametersProps) => {
  const params = { ...parameters };

  const getFormData = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);

    return {
      key: formData.get('key'),
      value: formData.get('value'),
    };
  };

  const add: FormEventHandler<HTMLFormElement> = (event) => {
    const { key, value } = getFormData(event);

    if (!key || typeof key !== 'string') {
      return;
    }

    onChange(Object.assign(params, { [key]: value }));
  };

  const remove: FormEventHandler<HTMLFormElement> = (event) => {
    const { key } = getFormData(event);
    delete params[key as string];
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
