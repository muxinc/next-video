import * as path from 'node:path';

import { VideoConfigComplete, getVideoConfig } from '../config.js';
import { isRemote } from './utils.js';

type ProviderConfig = VideoConfigComplete['provider']

export async function createAssetKey(filePathOrURL: string, provider: keyof ProviderConfig) {
  const { folder, providerConfig: config } = await getVideoConfig();
  const { generateAssetKey = defaultGenerateAssetKey } = config ?? {};
  return generateAssetKey(filePathOrURL, folder);
}

function defaultGenerateAssetKey(filePathOrURL: string, folder: string) {
  // By default local imports keep the same local folder structure.
  if (!isRemote(filePathOrURL)) return filePathOrURL;

  const url = new URL(filePathOrURL);

  // Remote imports are stored in the configured videos folder with just the file name.
  // This could easily lead to collisions if the same file name is used in different
  // remote sources. There are many ways to generate unique asset keys from remote sources,
  // so we leave this up to the user to configure if needed.
  return path.posix.join(folder, path.basename(decodeURIComponent(url.pathname)));
}
