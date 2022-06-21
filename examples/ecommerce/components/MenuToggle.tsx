import { IconButton, IconButtonProps } from '@sajari-ui/core';

interface MenuToggleProps extends Partial<IconButtonProps> {
  open?: boolean;
}

const MenuToggle = ({ open, ...rest }: MenuToggleProps) => (
  <IconButton
    display="lg:hidden"
    appearance="ghost"
    margin="ml-2"
    iconSize="md"
    {...rest}
    icon={open ? 'close' : 'menu'}
    label={`${open ? 'Close' : 'Open'} menu`}
  />
);

export default MenuToggle;
