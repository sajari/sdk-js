/**
 * Check if we're in a server-side rendering context
 */
export const isSSR = () => typeof window === "undefined";
