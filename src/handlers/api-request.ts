import chalk from 'chalk';
import Mux from '@mux/mux-node';
import { updateAsset, Asset } from '../assets.js';
import log from '../logger.js';
import { pollForAssetReady } from './local-upload.js';

let mux: Mux;

// We don't want to blow things up immediately if Mux isn't configured, but we also don't want to
// need to initialize it every time in situations like polling. So we'll initialize it lazily but cache
// the instance.
function initMux() {
  mux = new Mux();
}

export default async function handleVideoAdded(asset: Asset) {
  if (!asset.originalFilePath) {
    log.error('No URL provided for asset.');
    console.error(asset);
    return;
  }

  initMux();

  if (asset.status === 'ready') {
    return;
  } else if (asset.status === 'processing') {
    log.info(log.label('Asset is already processing. Polling for completion:'), asset.originalFilePath);
    return pollForAssetReady(asset.originalFilePath, asset);
  }

  const src = asset.originalFilePath;

  const assetObj = await mux.video.assets.create({
    // @ts-ignore
    input: [{
      url: asset.originalFilePath
    }],
    playback_policy: ['public']
  });

  log.info(log.label('Asset is processing:'), src);
  log.space(chalk.gray('>'), log.label('Mux Asset ID:'), assetObj.id);

  const processingAsset = await updateAsset(src, {
    status: 'processing',
    externalIds: {
      assetId: assetObj.id!,
    },
  });

  return pollForAssetReady(src, processingAsset);
}
