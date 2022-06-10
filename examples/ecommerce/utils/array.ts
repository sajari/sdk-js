/**
 * Format a number into a localised format
 *
 * @param {Array} array1
 * @param {Array} array2
 */
export function arrayEquals<T = any>(array1: T[] = [], array2: T[] = []) {
  const sorted = array2.sort();
  return array1.length === array2.length && array1.sort().every((v, i) => v === sorted[i]);
}

export default {};
