import { readFile } from 'node:fs/promises';

export default async function loader(this: any, source: any) {
  const vid = await readFile(this.resourcePath + '.json', 'utf-8');

  return `export default ${vid}`;
}
