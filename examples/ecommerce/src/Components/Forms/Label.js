/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/prop-types */

const Label = ({ htmlFor, srOnly, className = '', ...rest }) => {
  return <label htmlFor={htmlFor} className={`${className} ${srOnly ? 'sr-only' : ''}`} {...rest} />;
};

export default Label;
