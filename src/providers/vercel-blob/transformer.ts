import type { Asset, TransformedAsset, AssetSource } from '../../assets.js';

export function transform(asset: Asset): TransformedAsset {
  // Fallback to asset.externalIds for backwards compatibility with older assets.
  const providerDetails = asset.providerSpecific?.['vercel-blob'] ?? asset.externalIds;
  if (!providerDetails) return asset;

  const source: AssetSource = {
    src: providerDetails.url
  };

  if (providerDetails.contentType) {
    source.type = providerDetails.contentType;
  }

  return {
    ...asset,
    sources: [source],
  };
}
