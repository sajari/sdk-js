/**
 * Check if we're in a server-side rendering context
 * @hidden
 */
export const isSSR = () => typeof window === "undefined";
