import type { Asset } from '../../assets.js';

export function transform(asset: Asset) {
  // Fallback to asset.externalIds for backwards compatibility with older assets.
  const providerDetails = asset.externalIds;
  if (!providerDetails) return asset;

  const source: Record<string, string> = {
    src: providerDetails.url
  };

  return {
    ...asset,
    sources: [source],
  };
}
