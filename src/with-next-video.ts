import symlinkDir from 'symlink-dir';
import chokidar from 'chokidar';

import path from 'node:path';
import fs from 'node:fs/promises';

import { VIDEO_PATH } from './constants.js';

export default async function withNextVideo(nextConfig: any) {
  if (process.argv[2] === 'dev') {
    const TMP_PUBLIC_VIDEO_PATH = path.join(process.cwd(), 'public/_video');

    await symlinkDir(VIDEO_PATH, TMP_PUBLIC_VIDEO_PATH);

    process.on('exit', async () => {
      await fs.unlink(TMP_PUBLIC_VIDEO_PATH);
    });
  }

  return Object.assign({}, nextConfig, {
    webpack(config: any, options: any) {
      if (!options.defaultLoaders) {
        throw new Error(
          'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
        );
      }

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
