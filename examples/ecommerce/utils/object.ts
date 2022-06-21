import is from './is';

/**
 * Deep extend destination object with N more objects
 * @param {Object} target
 * @param {Object} sources
 */
export function extend<T extends Record<any, any>>(target: T = {} as T, ...sources: any[]): T {
  if (!sources.length) {
    return target;
  }

  const source = sources.shift();

  if (!is.object(source)) {
    return target;
  }

  Object.keys(source).forEach((key) => {
    if (is.object(source[key])) {
      if (!Object.keys(target).includes(key)) {
        Object.assign(target, { [key]: {} });
      }

      extend(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  });

  return extend(target, ...sources);
}

/**
 * Sort an object based on a root or child property value
 * @param {Object} obj
 * @param {Boolean} asc - Ascending order?
 * @param {String} prop - Child property to sort on
 * @param {Array} pinned - Pin some items to the top (handy for checkbox lists where you may want to pin selected to the top)
 */
export const sortObject = <T extends Record<any, any>>(
  obj: T,
  asc = true,
  prop: string | null = null,
  pinned: string[] = [],
) => {
  const hasProp = is.string(prop) && !is.empty(prop);

  return Object.keys(obj)
    .sort((a, b) => {
      const l = hasProp ? obj[a][prop] : obj[a];
      const r = hasProp ? obj[b][prop] : obj[b];

      return asc ? l - r : r - l;
    })
    .sort((a, b) => pinned.indexOf(b) - pinned.indexOf(a))
    .reduce((out, key) => Object.assign(out, { [key]: obj[key] }), {} as T);
};

/**
 * Ghetto clone of an object
 * @param {Object} obj
 */
export function cloneDeep<T extends Record<any, any>>(obj: T) {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Get the first x properties from an Object
 * @param {Object} obj
 * @param {Number} startIndex
 * @param {Number} length
 */
export function sliceObject<T extends Record<any, any>>(obj: T, startIndex: number, length: number) {
  if (!is.number(startIndex) || !is.number(length) || !is.object(obj)) {
    return obj;
  }

  return Object.keys(obj)
    .slice(startIndex, length)
    .reduce((out, key) => Object.assign(out, { [key]: obj[key] }), {} as T);
}
