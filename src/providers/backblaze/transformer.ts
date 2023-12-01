import type { Asset, AssetSource } from '../../assets.js';

export function transform(asset: Asset) {
  const providerSpecifics = asset.providerSpecific?.backblaze;
  if (!providerSpecifics) return asset;

  const src = new URL(providerSpecifics.endpoint);
  src.hostname = `${providerSpecifics.bucket}.${src.hostname}`;

  const basename = asset.originalFilePath.split('/').pop();
  if (basename) src.pathname = basename

  const source: AssetSource = { src: `${src}` };

  return {
    ...asset,
    sources: [source],
  };
}
