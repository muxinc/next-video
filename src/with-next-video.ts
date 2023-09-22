import symlinkDir from 'symlink-dir';

import path from 'node:path';
import fs from 'node:fs/promises';

import { VIDEOS_PATH } from './constants.js';

export default async function withNextVideo(nextConfig: any) {
  // We should probably switch to using `phase` here, just a bit concerned about backwards compatibility.
  if (process.argv[2] === 'dev') {
    const TMP_PUBLIC_VIDEOS_PATH = path.join(process.cwd(), 'public/_videos');

    await symlinkDir(VIDEOS_PATH, TMP_PUBLIC_VIDEOS_PATH);

    process.on('exit', async () => {
      await fs.unlink(TMP_PUBLIC_VIDEOS_PATH);
    });
  }

  if (typeof nextConfig === 'function') {
    return async (...args: any[]) => {
      const nextConfigResult = await Promise.resolve(nextConfig(...args));
      return withNextVideo(nextConfigResult);
    };
  }

  return Object.assign({}, nextConfig, {
    webpack(config: any, options: any) {
      if (!options.defaultLoaders) {
        throw new Error(
          'This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade'
        );
      }

      if (Array.isArray(config.externals)) {
        config.externals.unshift({
          sharp: 'commonjs sharp'
        });
      } else {
        config.externals = Object.assign({}, {
          sharp: 'commonjs sharp'
        }, config.externals);
      }

      config.experiments.buildHttp = {
        allowedUris: [
          /https?:\/\/.*\.(mp4|webm|mkv|ogg|ogv|wmv|avi|mov|flv|m4v|3gp)$/,
          ...(config.experiments.buildHttp?.allowedUris ?? [])
        ],
        ...(config.experiments.buildHttp || {}),
        // Disable cache to prevent Webpack from downloading the remote sources.
        cacheLocation: false,
      }

      config.module.rules.push({
        test: /\.(mp4|webm|mkv|ogg|ogv|wmv|avi|mov|flv|m4v|3gp)$/,
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
