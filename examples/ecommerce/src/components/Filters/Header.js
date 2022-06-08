/* eslint-disable react/prop-types */
import { Button, Flex, Heading } from '@sajari-ui/core';

const Header = ({ title, filtered = false, onReset = () => {} }) => (
  <Flex alignItems="items-center" margin="mb-2">
    <Heading as="h2" size="xs">
      {title}
    </Heading>

    {filtered && (
      <Button
        onClick={onReset}
        appearance="link"
        spacing="none"
        margin="ml-auto"
        fontSize="text-xs"
        textTransform="uppercase"
      >
        Reset
      </Button>
    )}
  </Flex>
);

export default Header;
