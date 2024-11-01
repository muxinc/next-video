import symlinkDir from 'symlink-dir';
import { join, dirname } from 'node:path';
import fs from 'node:fs';
import { env } from 'node:process';
import { fileURLToPath } from 'node:url';
import logger from './utils/logger.js';
import { getPackageVersion } from './utils/utils.js';
import { setVideoConfig } from './config.js';
import type { VideoConfig } from './config.js';

let hasWarned = false;

export function withNextVideo(nextConfig: any, videoConfig?: VideoConfig) {
  const videoConfigComplete = setVideoConfig(videoConfig);
  const { path, folder, provider } = videoConfigComplete;

  // env VARS have to be set before the async function return!!

  // Don't use `process.env` here because Next.js replaces public env vars during build.
  env['NEXT_PUBLIC_VIDEO_OPTS'] = JSON.stringify({ path, folder, provider });

  // We should probably switch to using `phase` here, just a bit concerned about backwards compatibility.
  if (process.argv[2] === 'dev') {
    // Don't use `process.env` here because Next.js replaces public env vars during build.
    env['NEXT_PUBLIC_DEV_VIDEO_OPTS'] = JSON.stringify({ path, folder, provider });
  }

  if (typeof nextConfig === 'function') {
    return async (...args: any[]) => {
      const nextConfigResult = await nextConfig(...args);
      return withNextVideo(nextConfigResult, videoConfig);
    };
  }

  // We should probably switch to using `phase` here, just a bit concerned about backwards compatibility.
  if (process.argv[2] === 'dev') {
    const VIDEOS_PATH = join(process.cwd(), folder);
    const TMP_PUBLIC_VIDEOS_PATH = join(process.cwd(), 'public', `_next-video`);

    symlinkDir(VIDEOS_PATH, TMP_PUBLIC_VIDEOS_PATH);

    process.on('exit', async () => {
      fs.unlinkSync(TMP_PUBLIC_VIDEOS_PATH);
    });
  }

  const nextVersion = getPackageVersion('next');

  if (nextVersion && nextVersion.startsWith('15.')) {
    nextConfig.outputFileTracingIncludes = {
      ...nextConfig.outputFileTracingIncludes,
      [path]: [`./${folder}/**/*.json`],
    };
  } else {
    const experimental = { ...nextConfig.experimental };
    experimental.outputFileTracingIncludes = {
      ...experimental.outputFileTracingIncludes,
      [path]: [`./${folder}/**/*.json`],
    };
    nextConfig.experimental = experimental;
  }

  if (!hasWarned && process.env.TURBOPACK && !process.env.NEXT_VIDEO_SUPPRESS_TURBOPACK_WARNING) {
    hasWarned = true;

    const nextVideoVersion = getPackageVersion('next-video');

    logger.space(logger.label(`▶︎ next-video ${nextVideoVersion}\n`));
    logger.warning(
      `You are using next-video with \`next ${
        process.env.NODE_ENV === 'development' ? 'dev' : 'build'
      } --turbo\`. next-video doesn't yet fully support Turbopack.\n  We recommend temporarily removing the \`--turbo\` flag for use with next-video.\n`
    );
    logger.warning(
      `Follow this issue for progress on next-video + Turbopack: https://github.com/muxinc/next-video/issues/266.\n  (You can suppress this warning by setting NEXT_VIDEO_SUPPRESS_TURBOPACK_WARNING=1 as environment variable)\n`
    );
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
          sharp: 'commonjs sharp',
        });
      } else {
        config.externals = Object.assign(
          {},
          {
            sharp: 'commonjs sharp',
          },
          config.externals
        );
      }

      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        // Silence warning about dynamic import of next.config file.
        // > [webpack.cache.PackFileCacheStrategy/webpack.FileSystemInfo] Parsing of /next-video/dist/config.js for build dependencies failed at 'import(fileUrl.
        // > Build dependencies behind this expression are ignored and might cause incorrect cache invalidation.
        level: 'error',
      };

      config.experiments.buildHttp = {
        allowedUris: [
          /https?:\/\/.*\.(mp4|webm|mkv|ogg|ogv|wmv|avi|mov|flv|m4v|3gp)\??(?:&?[^=&]*=[^=&]*)*$/,
          ...(config.experiments.buildHttp?.allowedUris ?? []),
        ],
        ...(config.experiments.buildHttp || {}),
        // Disable cache to prevent Webpack from downloading the remote sources.
        cacheLocation: false,
      };

      const scriptDir =
        typeof __dirname === 'string'
          ? __dirname // CJS module
          : dirname(fileURLToPath(import.meta.url)); // ESM module

      config.module.rules.push(
        {
          test: /\.(mp4|webm|mkv|ogg|ogv|wmv|avi|mov|flv|m4v|3gp)\??(?:&?[^=&]*=[^=&]*)*$/,
          use: [
            {
              loader: join(scriptDir, 'webpack/video-json-loader.js'),
            },
            {
              loader: join(scriptDir, 'webpack/video-raw-loader.js'),
            },
          ],
          type: 'json',
        },
        {
          test: /\.(mp4|webm|mkv|ogg|ogv|wmv|avi|mov|flv|m4v|3gp)\.json\??(?:&?[^=&]*=[^=&]*)*$/,
          use: [
            {
              loader: join(scriptDir, 'webpack/video-json-loader.js'),
            },
          ],
          type: 'json',
        }
      );

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    },
  });
}
