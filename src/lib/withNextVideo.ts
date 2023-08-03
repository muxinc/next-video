import chokidar from 'chokidar';
import path from 'node:path';
import { createAsset } from './assets.js';
import { callHandlers } from './videoHandler';

import { FILES_PATH } from './config.js';

async function init() {
	console.info('- [next-video]: Watching for changes in the files directory:', FILES_PATH);
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
			console.log(`- [next-video]: New file found: ${filePath}`);
			callHandlers('local.video.added', newAsset);
		}
	});

	process.on('exit', () => {
		console.log('e tu brute');
	});
}

export default async function withNextVideo(nextConfig: any) {
	if (process.argv[2] === 'dev') {
		console.info('- [next-video]: Initializing NextVideo.');
		await init();
		console.info('- [next-video]: NextVideo ready.');
	}
	return nextConfig;
}
