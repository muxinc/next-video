import type { Asset, AssetSource } from '../../assets.js';

export function transform(asset: Asset) {
  const providerMetadata = asset.providerMetadata?.backblaze;
  if (!providerMetadata) return asset;

  const src = new URL(providerMetadata.endpoint);
  src.hostname = `${providerMetadata.bucket}.${src.hostname}`;

  const basename = asset.originalFilePath.split('/').pop();
  if (basename) src.pathname = basename

  const source: AssetSource = { src: `${src}` };

  return {
    ...asset,
    sources: [source],
  };
}
