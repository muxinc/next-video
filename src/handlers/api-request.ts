import * as providers from '../providers/providers.js';
import { camelCase } from '../utils.js';
import type { Asset } from '../assets.js';
import type { HandlerConfig } from '../video-handler.js';

export async function uploadRequestedFile(asset: Asset, config: HandlerConfig) {
  for (let [key, provider] of Object.entries(providers)) {
    if (key === camelCase(config.provider)) {
      return provider.uploadRequestedFile(asset);
    }
  }
}
