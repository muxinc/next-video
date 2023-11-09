
export function camelCase(name: string) {
  return name.replace(/[-_]([a-z])/g, ($0, $1) => $1.toUpperCase());
}
