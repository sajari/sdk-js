/* eslint-disable react/prop-types */
import { IconMenu, IconRemove } from './Icons';

const MenuToggle = ({ open, ...rest }) => (
  <button
    type="button"
    className="flex items-center px-3 py-3 ml-2 text-gray-500 transition-all transition rounded hover:bg-gray-100 focus:bg-gray-100 lg:hidden focus:outline-none focus:text-gray-700 focus:shadow-outline"
    {...rest}
  >
    {open ? <IconRemove /> : <IconMenu />}

    <span className="sr-only">{`${open ? 'Close' : 'Open'} menu`}</span>
  </button>
);

export default MenuToggle;
