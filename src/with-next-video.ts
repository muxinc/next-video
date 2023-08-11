import chokidar from 'chokidar';

import path from 'node:path';

import { createAsset } from './assets.js';
import { callHandlers } from './video-handler.js';
import log from './logger.js';

import { FILES_PATH } from './constants.js';

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

  // return nextConfig;

  return Object.assign({}, nextConfig, {
    webpack(config: any, options: any) {
      const { isServer } = options;

      if (!options.defaultLoaders) {
        throw new Error(
          'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
        );
      }

      // const prefix = nextConfig.assetPrefix || '';
      // const basePath = nextConfig.basePath || '';

      config.module.rules.push({
        test: /\.(mp4|webm|mov|ogg|swf|ogv)$/,
        use: [
          {
            loader: require.resolve('./webpack-loader'),
            // options: {
            //   publicPath: `${prefix || basePath}/_next/static/videos/`,
            //   outputPath: `${isServer ? '../' : ''}static/videos/`,
            //   name: '[name]-[hash].[ext]',
            // },
          },
        ],
      });

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    },
  });
}
