import is from './is';

/**
 * Format a number into a localised format
 *
 * @param {Number} input
 * @param {String} currencyCode - The ISO currency code
 */
export function formatNumber(input = 0, currencyCode = '', neutral = false) {
  if (!is.number(input)) {
    return input;
  }

  if (!currencyCode) {
    return new Intl.NumberFormat(navigator.language).format(input);
  }

  const lang = neutral ? navigator.language.split('-')[0] : navigator.language;

  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency: currencyCode,
  }).format(input);
}

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param {Number} input
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
export function clamp(input = 0, min = 0, max = 255) {
  return Math.min(Math.max(input, min), max);
}
