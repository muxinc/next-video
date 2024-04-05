import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createAsset, getAssetConfigPath } from '../assets.js';


// https://webpack.js.org/api/loaders#raw-loader
export const raw = true;

export default async function loader(this: any) {
  const params = new URLSearchParams(this.resourceQuery);
  // Don't include the thumbnailTime URL param in the asset path.
  params.delete('thumbnailTime');

  const query = params.size ? `?${params}` : '';
  const importPath = `${this.resourcePath}${query}`;
  const assetPath = path.resolve(await getAssetConfigPath(importPath));

  this.addDependency(assetPath);

  let asset;
  try {
    asset = await readFile(assetPath, 'utf-8');
  } catch {
    asset = JSON.stringify(await createAsset(importPath, {
      status: 'sourced'
    }));
  }
  return `${asset}`;
}
