import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

import { VIDEOS_DIR } from './constants.js';

export default async function loader(this: any, source: any) {

  const assetPath = path.resolve(getAssetConfigPath(this.resourcePath));

  this.addDependency(assetPath);

  let asset;

  try {
    asset = await readFile(assetPath, 'utf-8');
  } catch {

    const originalFilePath = isRemote(this.resourcePath)
      ? this.resourcePath
      : path.relative(process.cwd(), this.resourcePath);

    asset = JSON.stringify({
      status: 'sourced',
      originalFilePath
    });

    await writeFile(assetPath, asset, { flag: 'wx' });
  }

  return `export default ${asset}`;
}

function getAssetConfigPath(filePath: string) {
  if (isRemote(filePath)) {
    // Add the asset directory and make remote url a safe file path.
    return `${VIDEOS_DIR}/${toSafePath(filePath)}.json`;
  }
  return `${filePath}.json`
}

function isRemote(filePath: string) {
  return /^https?:\/\//.test(filePath);
}

function toSafePath(str: string) {
  return str
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_');
}
