// ==========================================================================
// Type checking
// ==========================================================================

const getConstructor = (input: any) => (input !== null && typeof input !== 'undefined' ? input.constructor : null);
const instanceOf = (input: unknown, constructor: any) => Boolean(input && constructor && input instanceof constructor);
const isObject = (input: unknown): input is Object => getConstructor(input) === Object;
const isNumber = (input: unknown): input is Number => getConstructor(input) === Number && !Number.isNaN(input);
const isString = (input: unknown): input is String => getConstructor(input) === String;
const isBoolean = (input: unknown): input is Boolean => getConstructor(input) === Boolean;
const isFunction = (input: unknown): input is Function => getConstructor(input) === Function;
const isArray = <T = any>(input: unknown): input is T[] => Array.isArray(input);
const isElement = (input: unknown): input is Element => instanceOf(input, Element);
const isImage = (input: unknown): input is HTMLImageElement => instanceOf(input, HTMLImageElement);
const isMedia = (input: unknown): input is HTMLMediaElement => instanceOf(input, HTMLMediaElement);
const isEvent = (input: unknown): input is Event => instanceOf(input, Event);
const isNullOrUndefined = (input: unknown): input is null | undefined => input === null || typeof input === 'undefined';

const isEmpty = (input: unknown) =>
  isNullOrUndefined(input) ||
  ((isString(input) || isArray(input)) && !input.length) ||
  (isObject(input) && !Object.keys(input).length);

const isUrl = (input: string) => {
  try {
    const url = new URL(input);
    return !isEmpty(url.hostname);
  } catch (e) {
    return false;
  }
};

export default {
  object: isObject,
  number: isNumber,
  string: isString,
  function: isFunction,
  boolean: isBoolean,
  array: isArray,
  element: isElement,
  event: isEvent,
  nullOrUndefined: isNullOrUndefined,
  url: isUrl,
  empty: isEmpty,
  image: isImage,
  media: isMedia,
};
