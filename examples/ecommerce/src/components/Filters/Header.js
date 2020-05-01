/* eslint-disable react/prop-types */

const Header = ({ title, filtered = false, onReset = () => {} }) => (
  <div className="flex items-center mb-2">
    <h2 className="text-xs font-medium text-gray-400 uppercase">{title}</h2>
    {filtered && (
      <button type="button" onClick={onReset} className="ml-auto text-xs text-blue-500 uppercase">
        Reset
      </button>
    )}
  </div>
);

export default Header;
