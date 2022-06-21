import { Label, Text } from '@sajari-ui/core';
import { InputHTMLAttributes, ReactNode } from 'react';
import classnames from 'classnames';

export interface CheckboxProps
  extends Pick<InputHTMLAttributes<HTMLInputElement>, 'checked' | 'disabled' | 'onChange' | 'value'> {
  count?: number | string;
  label: ReactNode;
  className?: string;
  id: string;
}

const Checkbox = ({ label, id, checked, disabled, onChange, count, value, className, ...rest }: CheckboxProps) => {
  return (
    <div className={classnames('flex text-sm items-start', className)} {...rest}>
      <div className="flex items-center">
        &#8203;
        <input
          id={id}
          type="checkbox"
          className="w-4 h-4 text-blue-500 form-checkbox disabled:bg-gray-300 disabled:border-gray-400"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          value={value}
        />
      </div>

      <Label htmlFor={id ?? ''} display="inline-flex" alignItems="items-center" margin="ml-2" textColor="text-gray-700">
        {label}
      </Label>

      {count && (
        <Text as={'span' as any} margin="ml-auto" fontSize="text-xs" textColor="text-gray-400">
          {count}
        </Text>
      )}
    </div>
  );
};

export default Checkbox;
