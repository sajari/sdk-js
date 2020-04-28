/* eslint-disable react/prop-types */

const Select = ({ small = false, className = '', ...rest }) => {
  return (
    <select className={`border-gray-200 form-select ${small ? 'form-select--small' : ''} ${className}`} {...rest} />
  );
};

export default Select;
