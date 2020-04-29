/* eslint-disable react/prop-types */

import Label from './Label';

const Checkbox = ({ label, id, checked, disabled, onInput, count, value, className = '', ...rest }) => {
  return (
    <div className={`flex items-start text-sm ${className}`} {...rest}>
      <div className="flex items-center">
        &#8203;
        <input
          id={id}
          type="checkbox"
          className="w-4 h-4 text-blue-500 form-checkbox disabled:bg-gray-300 disabled:border-gray-400"
          checked={checked}
          disabled={disabled}
          onInput={onInput}
          value={value}
        />
      </div>
      <Label htmlFor={id} className="inline-flex items-center ml-2 text-gray-700">
        {label}
      </Label>
      {count && <span className="ml-auto text-xs text-gray-400">{count}</span>}
    </div>
  );
};

export default Checkbox;
