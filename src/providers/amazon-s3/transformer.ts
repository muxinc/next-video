import type { Asset, AssetSource } from '../../assets.js';

export function transform(asset: Asset) {
  const providerMetadata = asset.providerMetadata?.['amazon-s3'];
  if (!providerMetadata) return asset;

  const src = new URL(providerMetadata.endpoint);
  src.hostname = `${providerMetadata.bucket}.${src.hostname}`;
  src.pathname = providerMetadata.key;

  const source: AssetSource = { src: `${src}` };

  return {
    ...asset,
    sources: [source],
  };
}
