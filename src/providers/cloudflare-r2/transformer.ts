import type { Asset, AssetSource } from '../../assets.js';

export function transform(asset: Asset) {
  const providerMetadata = asset.providerMetadata?.['cloudflare-r2'];
  if (!providerMetadata) return asset;

  const src = new URL(providerMetadata.bucketUrlPublic);
  src.pathname = providerMetadata.key;

  const source: AssetSource = { src: `${src}` };

  return {
    ...asset,
    sources: [source],
  };
}
