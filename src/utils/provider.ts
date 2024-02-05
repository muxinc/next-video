import * as path from 'node:path';

import { getVideoConfig } from '../config.js';
import { isRemote } from './utils.js';

import type { ProviderConfig } from '../config.js';

export async function createAssetKey(filePathOrURL: string, provider: keyof ProviderConfig) {
  const { folder, providerConfig } = await getVideoConfig();
  const config = providerConfig[provider];
  const { generateAssetKey = defaultGenerateAssetKey } = config ?? {};

  if (!isRemote(filePathOrURL)) {
    return generateAssetKey(filePathOrURL);
  }

  // Add the configured folder and make remote url a safe file path.
  return path.posix.join(folder, generateAssetKey(filePathOrURL));
}

function defaultGenerateAssetKey(filePathOrURL: string) {
  // By default local imports keep the same local folder structure.
  if (!isRemote(filePathOrURL)) return filePathOrURL;

  const url = new URL(filePathOrURL);

  // By default remote imports are stored in the root folder with just the file name.

  // This could easily lead to collisions if the same file name is used in different
  // remote sources. There are many ways to generate unique asset keys from
  // remote sources, so we leave this up to the user to configure.
  return path.basename(decodeURIComponent(url.pathname));
}
