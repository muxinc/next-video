import chokidar from 'chokidar';
import path from 'node:path';
import { createAsset } from './assets.js';
import { callHandlers } from './videoHandler';
import log from './logger';

import { FILES_PATH } from './config.js';

async function init() {
	log('info', 'Watching for changes in the files directory:', FILES_PATH);
	const watcher = chokidar.watch(FILES_PATH, {
		ignored: /(^|[\/\\])\..*|\.json$/,
		persistent: true,
	});

	watcher.on('add', async (filePath, stats) => {
		const relativePath = path.relative(process.cwd(), filePath);
		const newAsset = await createAsset(relativePath, {
			size: stats?.size,
		});

		if (newAsset) {
			log('info', `New file found: ${filePath}`);
			callHandlers('local.video.added', newAsset);
		}
	});

	process.on('exit', () => {
		log('info', 'NextVideo shutting down.');
	});
}

export default async function withNextVideo(nextConfig: any) {
	if (process.argv[2] === 'dev') {
		log('info', 'Initializing NextVideo.');
		await init();
		log('info', 'NextVideo ready.');
	}
	return nextConfig;
}
