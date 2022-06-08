/* eslint-disable react/prop-types */
import { IconButton } from '@sajari-ui/core';

const MenuToggle = ({ open, ...rest }) => (
  <IconButton
    display="lg:hidden"
    appearance="ghost"
    icon={open ? 'close' : 'menu'}
    label={`${open ? 'Close' : 'Open'} menu`}
    margin="ml-2"
    iconSize="md"
    {...rest}
  />
);

export default MenuToggle;
