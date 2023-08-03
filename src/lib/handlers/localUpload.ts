import fs from 'node:fs/promises';
import path from 'node:path';
import Mux from '@mux/mux-node';
import { fetch as uFetch } from 'undici';

import videoHandler from '../videoHandler';
import { updateAsset, Asset } from '../assets';

const mux = new Mux();

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollForAssetReady(filePath: string, asset: Asset) {
	if (!asset.externalIds?.assetId) {
		console.error('- [next-video]: No assetId provided for asset.');
		return;
	}

	const assetId = asset.externalIds?.assetId;

	const muxAsset = await mux.video.assets.retrieve(assetId);
	const playbackId = muxAsset.playback_ids?.[0].id;

	let updatedAsset: Asset = asset;
	if (asset.externalIds?.playbackId !== playbackId) {
		// We can go ahead and update it here so we have the playback ID, even before the Asset is ready.
		updatedAsset = await updateAsset(filePath, {
			externalIds: {
				playbackId,
			},
		});
	}

	if (muxAsset.status === 'ready') {
		console.info(`- [next-video]: Asset is ready: ${filePath} (Mux Playback ID: ${playbackId}})`);
		return updateAsset(filePath, {
			status: 'ready',
			externalIds: {
				playbackId,
			},
		});

		// TODO: do we want to do something like `callHandlers('video.asset.ready', asset)` here? It'd be faking the webhook.
	} else {
		// We should also do something in here that allows us to complain loudly if the server is killed before we get here.
		await sleep(1000);
		return pollForAssetReady(filePath, updatedAsset);
	}
}

async function pollForUploadAsset(filePath: string, asset: Asset) {
	if (!asset.externalIds?.uploadId) {
		console.error('- [next-video]: No uploadId provided for asset.');
		return;
	}

	const uploadId = asset.externalIds?.uploadId;

	const muxUpload = await mux.video.uploads.retrieve(uploadId);

	if (muxUpload.asset_id) {
		console.info(`- [next-video]: Asset is processing: ${filePath} (Mux ID: ${muxUpload.asset_id})`);
		const processingAsset = await updateAsset(filePath, {
			status: 'processing',
			externalIds: {
				assetId: muxUpload.asset_id,
			},
		});

		return pollForAssetReady(filePath, processingAsset);
	} else {
		// We should do something in here that allows us to complain loudly if the server is killed before we get here.
		await sleep(1000);
		return pollForUploadAsset(filePath, asset);
	}
}

export default async function createAndUploadToMux(asset: Asset) {
	if (!asset.originalFilePath) {
		console.error('- [next-video]: No filePath provided for asset.');
		return;
	}

	const src = asset.originalFilePath;

	// Create a direct upload url
	const upload = await mux.video.uploads.create({
		cors_origin: '*',
		new_asset_settings: {
			playback_policy: ['public'],
		},
	});

	await updateAsset(src, {
		status: 'uploading',
		externalIds: {
			uploadId: upload.id as string, // more typecasting while we use the beta mux sdk
		},
	});

	// get the file locally and such
	const filePath = path.join(src);
	const fileDescriptor = await fs.open(filePath);
	const fileStats = await fileDescriptor.stat();
	const stream = fileDescriptor.createReadStream();

	console.info(`- [next-video]: Uploading file ${filePath} (${fileStats.size} bytes)`);

	try {
		// I'm having to do some annoying, defensive typecasting here becuase we need to fix some OAS spec stuff.
		await uFetch(upload.url as string, {
			method: 'PUT',
			// @ts-ignore
			body: stream,
			duplex: 'half',
		});

		stream.close();
		await fileDescriptor.close();
	} catch (e) {
		console.error(e);
	}

	console.info(`- [next-video]: File uploaded: ${filePath} (${fileStats.size} bytes)`);
	const processingAsset = await updateAsset(src, {
		status: 'processing',
	});

	return pollForUploadAsset(src, processingAsset);
}
