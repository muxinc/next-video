export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function camelCase(name: string) {
  return name.replace(/[-_]([a-z])/g, ($0, $1) => $1.toUpperCase());
}

/**
* Performs a deep merge of objects and returns a new object.
* Does not modify objects (immutable) and merges arrays via concatenation.
*/
export function deepMerge(...objects: any[]) {
  const result: any = {};
  for (const obj of objects) {
    for (const key in obj) {
      const existing = result[key];
      const val = obj[key];
      if (Array.isArray(val) && Array.isArray(existing)) {
        result[key] = existing.concat(...val);
      } else if (isObject(val) && isObject(existing)) {
        result[key] = deepMerge(existing, val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

export function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}
