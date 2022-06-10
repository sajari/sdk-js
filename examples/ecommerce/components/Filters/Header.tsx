/* eslint-disable react/prop-types */
import { Button, Flex, Heading } from '@sajari-ui/core';
import {} from '../Checkbox';

export interface HeaderProps {
  title: string;
  filtered?: boolean;
  onReset?: () => void;
}

const Header = ({ title, filtered = false, onReset = () => {} }: HeaderProps) => (
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
