import classnames from 'classnames';
import { createElement } from 'preact';
import PropTypes from 'prop-types';

export const buttonStyles = {
  default: 1,
  primary: 2,
  secondary: 3,
  danger: 4,
};

export const buttonSizes = {
  small: 1,
  medium: 2,
  large: 3,
  jumbo: 4,
};

const mapStyle = (style, disabled) => {
  switch (style) {
    case buttonStyles.default:
      return [
        disabled ? 'text-gray-300' : 'text-gray-500',
        disabled ? 'bg-gray-50' : 'bg-white',
        'border-gray-200',
        !disabled ? 'hover:text-gray-800' : '',
        !disabled ? 'focus:border-blue-300' : '',
      ];

    case buttonStyles.primary:
      return [
        'text-blue-700',
        'bg-blue-100',
        'border-blue-200',
        !disabled ? 'hover:border-blue-300' : '',
        !disabled ? 'focus:border-blue-300' : '',
      ];

    case buttonStyles.secondary:
      return [
        'text-gray-700',
        'bg-gray-100',
        'border-gray-200',
        !disabled ? 'hover:border-gray-300' : '',
        !disabled ? 'focus:border-gray-300' : '',
      ];

    case buttonStyles.danger:
      return [
        'text-red-700',
        'bg-red-100',
        'border-red-200',
        !disabled ? 'hover:border-red-300' : '',
        !disabled ? 'focus:border-red-300' : '',
      ];

    default:
      return [];
  }
};

const mapSize = (size, narrow) => {
  switch (size) {
    case buttonSizes.jumbo:
      return [narrow ? 'px-14' : 'px-20', 'py-8', 'text-lg'];

    case buttonSizes.large:
      return [narrow ? 'px-8' : 'px-10', 'py-4', 'text-lg'];

    case buttonSizes.medium:
      return [narrow ? 'px-3' : 'px-4', 'py-2', 'text-base'];

    case buttonSizes.small:
      return [narrow ? 'px-2' : 'px-3', 'py-2', 'text-sm'];

    default:
      return [];
  }
};

const Button = (props) => {
  const {
    block,
    children,
    className,
    disabled,
    href,
    narrow,
    rounded,
    pressed,
    size,
    style,
    target,
    type,
    ...rest
  } = props;

  const baseClassNames = [
    'relative',
    block ? 'flex w-full' : 'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition duration-150',
    'ease-in-out',
    'border',
    'focus:outline-none',
    !disabled ? 'focus:shadow-outline' : '',
  ];

  const buttonClassName = classnames(
    ...baseClassNames,
    ...mapStyle(pressed ? buttonStyles.primary : style, disabled),
    ...mapSize(size, narrow),
    className,
    {
      rounded,
    },
  );

  // Whether to use a button element
  const useButton = !href || !href.length;

  return createElement(
    useButton ? 'button' : 'a',
    {
      className: buttonClassName,
      target: !useButton ? target : undefined,
      type: useButton ? type : undefined,
      ...rest,
    },
    children,
  );
};

Button.defaultProps = {
  type: 'button',
  size: buttonSizes.medium,
  style: buttonStyles.default,
  href: undefined,
  target: undefined,
  pressed: false,
  disabled: false,
  block: false,
  className: undefined,
  rounded: true,
  narrow: false,
};

Button.propTypes = {
  type: PropTypes.oneOf(['submit', 'reset', 'button']),
  size: PropTypes.oneOf(Object.values(buttonSizes)),
  style: PropTypes.oneOf(Object.values(buttonStyles)),
  href: PropTypes.string,
  target: PropTypes.string,
  pressed: PropTypes.bool,
  disabled: PropTypes.bool,
  block: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  rounded: PropTypes.bool,
  narrow: PropTypes.bool,
};

export default Button;
