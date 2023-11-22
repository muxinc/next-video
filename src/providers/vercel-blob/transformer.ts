import type { Asset } from '../../assets.js';

export function transform(asset: Asset) {
  // Fallback to asset.externalIds for backwards compatibility with older assets.
  const providerDetails = asset.providerSpecific?.['vercel-blob'] ?? asset.externalIds;
  if (!providerDetails) return asset;

  const source: Record<string, string> = {
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
