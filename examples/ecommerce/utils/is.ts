// ==========================================================================
// Type checking
// ==========================================================================

const getConstructor = (input) => (input !== null && typeof input !== 'undefined' ? input.constructor : null);
const instanceOf = (input, constructor) => Boolean(input && constructor && input instanceof constructor);
const isObject = (input): input is Object => getConstructor(input) === Object;
const isNumber = (input): input is Number => getConstructor(input) === Number && !Number.isNaN(input);
const isString = (input): input is String => getConstructor(input) === String;
const isBoolean = (input): input is Boolean => getConstructor(input) === Boolean;
const isFunction = (input): input is Function => getConstructor(input) === Function;
const isArray = <T = any>(input): input is T[] => Array.isArray(input);
const isElement = (input): input is Element => instanceOf(input, Element);
const isImage = (input): input is HTMLImageElement => instanceOf(input, HTMLImageElement);
const isMedia = (input): input is HTMLMediaElement => instanceOf(input, HTMLMediaElement);
const isEvent = (input): input is Event => instanceOf(input, Event);
const isNullOrUndefined = (input): input is null | undefined => input === null || typeof input === 'undefined';
const isBase64 = (input) =>
  !isNullOrUndefined(input) &&
  (() => {
    try {
      return btoa(atob(input)) === input;
    } catch (err) {
      return false;
    }
  })();

const isEmpty = (input) =>
  isNullOrUndefined(input) ||
  ((isString(input) || isArray(input)) && !input.length) ||
  (isObject(input) && !Object.keys(input).length);

const isUrl = (input) => {
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
  base64: isBase64,
};
