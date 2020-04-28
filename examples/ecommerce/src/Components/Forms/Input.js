/* eslint-disable react/prop-types */

const Input = ({ className = '', type = 'text', ...rest }) => {
  return (
    <input
      className={`block w-full border-gray-200 pr-4 transition-all duration-100 ease-in-out form-input ${className}`}
      type={type}
      dir="auto"
      {...rest}
    />
  );
};

export default Input;
