import type { Asset, AssetSource } from '../../assets.js';

export function transform(asset: Asset) {
  const providerMetadata = asset.providerMetadata?.cloudinary;
  if (!providerMetadata) return asset;

  const source: AssetSource = { src: providerMetadata.secureUrl };

  return {
    ...asset,
    sources: [source],
    poster: `${providerMetadata.secureUrl}.jpg`,
  };
}
