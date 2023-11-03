import * as providers from '../providers/providers.js';
import type { Asset } from '../assets.js';
import type { HandlerConfig } from '../video-handler.js';

export async function uploadLocalFile(asset: Asset, config: HandlerConfig): Promise<Asset | undefined> {
  for (let [key, provider] of Object.entries(providers)) {
    if (key === config.provider) {
      return provider.uploadLocalFile(asset);
    }
  }
}
