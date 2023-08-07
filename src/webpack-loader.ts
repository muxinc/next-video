import path from 'node:path';
import { readFile } from 'node:fs/promises';

export default async function loader(this: any, source: any) {
  var jsonPath = path.resolve(this.resourcePath + '.json');

  this.addDependency(jsonPath);

  const vid = await readFile(jsonPath, 'utf-8');

  return `export default ${vid}`;
}
