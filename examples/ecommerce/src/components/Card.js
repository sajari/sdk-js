/* eslint-disable react/prop-types */

const Card = ({ children, className }) => (
  <div className={`p-2 bg-white border border-gray-200 rounded-md shadow-sm lg:p-4 ${className}`}>{children}</div>
);

export default Card;
