import is from './is';

/**
 * Format a template string with arguments
 * @param {String} input
 * @param {...String} args
 */
export function format(input, ...args) {
  if (is.empty(input)) {
    return input;
  }

  return input.toString().replace(/{(\d+)}/g, (match, i) => args[i].toString());
}

/**
 * Replace all occurances of a string in a string
 * @param {String} input
 * @param {String} find
 * @param {String} replace
 */
export const replaceAll = (input = '', find = '', replace = '') =>
  input.replace(new RegExp(find.toString().replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1'), 'g'), replace.toString());

/**
 * Convert a string to sentence case
 * @param {String} input
 */
export function toSentenceCase(input = '') {
  const regex = /(^\w{1}|\.\s*\w{1})/gi;
  return input.replace(regex, (s) => s.toUpperCase());
}

/**
 * Convert a string to title case
 * @param {String} input
 */
export const toTitleCase = (input = '') =>
  input.toString().replace(/\w\S*/g, (text) => `${text.charAt(0).toUpperCase()}${text.substr(1).toLowerCase()}`);

/**
 * Convert a string to kebab-case (mmm... kebabs 🌯🤤)
 * @param {String} input
 */
export function toKebabCase(input = '') {
  // Bail if not a string
  if (!is.string(input)) {
    return input;
  }

  let result = input;

  // Convert camelCase capitals to kebab-case.
  result = result.replace(/([a-z][A-Z])/g, (match) => `${match.substr(0, 1)}-${match.substr(1, 1).toLowerCase()}`);

  // Convert non-camelCase capitals to lowercase.
  result = result.toLowerCase();

  // Convert non-alphanumeric characters to hyphens
  result = result.replace(/[^-a-z0-9]+/g, '-');

  // Remove hyphens from both ends
  result = result.replace(/^-+/, '').replace(/-$/, '');

  return result;
}

/**
 * Transform the case of a string
 * @param {String} input
 * @param {String} case */
export function transformCase(input = '', type = '') {
  switch (type) {
    case 'uppercase':
      return input.toUpperCase();

    case 'lowercase':
      return input.toLowerCase();

    case 'titlecase':
      return toTitleCase(input);

    case 'sentencecase':
      return toSentenceCase(input);

    case 'kebabcase':
      return toKebabCase(input);

    default:
      return input;
  }
}
