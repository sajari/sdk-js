/* eslint-disable react/prop-types */

const Badge = ({ children, className }) => (
  <span
    className={`inline-flex items-center rounded bg-blue-100 text-blue-500 uppercase px-2 py-1 text-sm text-white font-medium ${className}`}
  >
    {children}
  </span>
);

export default Badge;
