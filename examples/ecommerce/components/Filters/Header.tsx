import { Button, Heading } from '@sajari-ui/core';

export interface HeaderProps {
  title: string;
  filtered?: boolean;
  onReset?: () => void;
}

const Header = ({ title, filtered = false, onReset = () => {} }: HeaderProps) => (
  <div className="flex items-center mb-2">
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
  </div>
);

export default Header;
