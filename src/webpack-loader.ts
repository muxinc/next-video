import path from 'node:path';
import { readFile } from 'node:fs/promises';

export default async function loader(this: any, source: any) {
  var jsonPath = path.resolve(this.resourcePath + '.json');

  this.addDependency(jsonPath);

  let vid;

  try {
    vid = await readFile(jsonPath, 'utf-8');
  } catch {

    const originalFilePath = path.relative(process.cwd(), this.resourcePath);

    vid = JSON.stringify({
      status: 'source',
      originalFilePath
    })
  }

  return `export default ${vid}`;
}
