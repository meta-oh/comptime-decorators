/**
 * Insert content to be injected on comptime mark
 * @param {string} name
 * @param {string} content
 */
export function insert(name, content) {
  (globalThis.__insertMap__ ??= new Map).set(name, content);
}
