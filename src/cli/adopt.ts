import { input, select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { Argv, Arguments } from 'yargs';
import { fetch } from 'undici';

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import log from '../utils/logger.js';
import { getVideoConfig } from '../config.js';
import { createAsset, updateAsset, Asset } from '../assets.js';
import { transform as muxTransform } from '../providers/mux/transformer.js';

const PLAYBACK_ID_REGEX = /^[a-zA-Z0-9]{22,}$/;

interface MuxMetadataResponse {
  'start-time': number;
  titles: Array<{
    language: string;
    title: string;
  }>;
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters except spaces, hyphens, underscores
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .toLowerCase();
}

function sanitizeImportName(filename: string): string {
  // Remove .mp4 extension if present
  const nameWithoutExt = filename.replace(/\.mp4$/, '');

  return nameWithoutExt
    .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special characters
    .replace(/[-\s]+(.)/g, (_, char) => char.toUpperCase()) // Convert kebab-case to camelCase
    .replace(/^[^a-zA-Z_$]/, '_') // Ensure starts with valid identifier character
    .replace(/[^a-zA-Z0-9_$]/g, '_'); // Replace any remaining invalid chars with underscores
}

async function fetchMuxMetadata(playbackId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://stream.mux.com/${playbackId}/metadata.json`);
    if (!response.ok) {
      return null;
    }
    const metadata = (await response.json()) as MuxMetadataResponse[];
    const title = metadata?.[0]?.titles?.[0]?.title;
    return title ? sanitizeFilename(title) : null;
  } catch (error) {
    // Silently fail - metadata is optional
    return null;
  }
}

export const command = 'adopt <playbackId>';
export const desc = 'Create a local asset metadata file for an existing Mux asset using its playback ID.';

export function builder(yargs: Argv) {
  return yargs
    .positional('playbackId', {
      describe: 'The Mux playback ID of the asset to adopt',
      type: 'string',
      demandOption: true,
    })
    .options({
      dir: {
        alias: 'd',
        describe: 'The directory to save the asset metadata file.',
        type: 'string',
        default: 'videos',
      },
      name: {
        alias: 'n',
        describe: 'Custom name for the asset file (without extension).',
        type: 'string',
      },
      'thumbnail-time': {
        alias: 't',
        describe: 'Thumbnail time in seconds for the poster image.',
        type: 'number',
      },
      interactive: {
        alias: 'i',
        describe: 'Run in interactive mode to configure all options.',
        type: 'boolean',
        default: true,
      },
    });
}

export async function handler(argv: Arguments) {
  const playbackId = argv.playbackId as string;
  const dir = argv.dir as string;
  const interactive = argv.interactive as boolean;

  // Validate playback ID format
  if (!PLAYBACK_ID_REGEX.test(playbackId)) {
    log.error('Invalid playback ID format. Mux playback IDs should be alphanumeric and at least 22 characters long.');
    return;
  }

  log.info(
    `${chalk.magenta.bold('next-video adopt')}: Creating asset metadata for playback ID: ${chalk.cyan(playbackId)}`
  );
  log.space();

  // Try to fetch metadata from Mux to get the title
  log.info('Fetching asset metadata from Mux...');
  const muxTitle = await fetchMuxMetadata(playbackId);
  if (muxTitle) {
    log.info(`Found title: ${chalk.cyan(muxTitle)} (sanitized for filename)`);
  } else {
    log.info('No metadata found or unable to fetch from Mux');
  }
  log.space();

  try {
    const videoConfig = await getVideoConfig();

    // Ensure we're using Mux as the provider
    if (videoConfig.provider !== 'mux') {
      log.warning(
        `Current provider is "${videoConfig.provider}". The adopt command is currently only compatible with Mux assets.`
      );

      if (interactive) {
        const proceed = await confirm({
          message: 'Do you want to proceed anyway?',
          default: false,
        });

        if (!proceed) {
          log.info('Adoption cancelled.');
          return;
        }
      }
    }

    let assetName = argv.name as string;
    let thumbnailTime = argv['thumbnail-time'] as number;

    // Interactive prompts
    if (interactive) {
      if (!assetName) {
        const defaultName = muxTitle || `adopted-${playbackId.slice(0, 8)}`;
        assetName = await input({
          message: 'Asset name (filename without extension):',
          default: defaultName,
          validate: (input: string) => {
            if (!input.trim()) return 'Asset name is required';
            if (input.includes('/') || input.includes('\\')) return 'Asset name should not contain path separators';
            return true;
          },
        });
      }

      const configureThumbnail = await confirm({
        message: 'Do you want to configure a custom thumbnail time?',
        default: false,
      });

      if (configureThumbnail && thumbnailTime === undefined) {
        const thumbnailInput = await input({
          message: 'Thumbnail time in seconds:',
          default: '0',
          validate: (input: string) => {
            const num = parseFloat(input);
            if (isNaN(num) || num < 0) return 'Please enter a valid number >= 0';
            return true;
          },
        });
        thumbnailTime = parseFloat(thumbnailInput);
      }
    } else {
      // Non-interactive mode - use defaults if not provided
      assetName = assetName || muxTitle || `adopted-${playbackId.slice(0, 8)}`;
    }

    // Compute original path from dir and name
    const originalPath = `${dir}/${assetName}.mp4`;

    // Create the asset metadata
    const now = Date.now();
    const baseAsset: Asset = {
      status: 'ready',
      originalFilePath: originalPath,
      provider: 'mux',
      providerMetadata: {
        mux: {
          playbackId: playbackId,
        },
      },
      createdAt: now,
      updatedAt: now,
    };

    // Add thumbnail time if specified
    if (thumbnailTime !== undefined) {
      baseAsset.providerMetadata!.mux.thumbnailTime = thumbnailTime;
    }

    // Transform the asset to generate sources and poster
    const transformedAsset = muxTransform(baseAsset, { thumbnailTime });

    // Generate blur data URL for the thumbnail
    try {
      const { createThumbHash } = await import('../providers/mux/provider.js');
      const blurDataURL = await createThumbHash(
        `https://image.mux.com/${playbackId}/thumbnail.webp?width=16&height=16`
      );
      transformedAsset.blurDataURL = blurDataURL;
    } catch (error) {
      log.warning('Could not generate blur data URL for thumbnail');
    }

    // Create the asset file path
    const assetFilePath = path.join(dir, `${assetName}.mp4`);
    const assetConfigPath = `${assetFilePath}.json`;

    // Save the asset metadata
    await videoConfig.saveAsset(assetConfigPath, transformedAsset);

    log.success(`Asset metadata created: ${chalk.cyan(assetConfigPath)}`);
    log.space();
    log.info('Asset details:');
    log.space(chalk.gray('>'), log.label('Playback ID:'), playbackId);
    log.space(chalk.gray('>'), log.label('Original Path:'), originalPath);
    log.space(chalk.gray('>'), log.label('Video Source:'), transformedAsset.sources?.[0]?.src || 'N/A');
    log.space(chalk.gray('>'), log.label('Poster:'), transformedAsset.poster || 'N/A');

    if (thumbnailTime !== undefined) {
      log.space(chalk.gray('>'), log.label('Thumbnail Time:'), `${thumbnailTime}s`);
    }

    log.space();
    log.info(`You can now import this asset in your Next.js application:`);
    log.space();
    const importName = sanitizeImportName(assetName);
    log.space(`${chalk.magenta('import')} Video ${chalk.magenta('from')} ${chalk.cyan("'next-video'")};`);
    log.space(
      `${chalk.magenta('import')} ${importName} ${chalk.magenta('from')} ${chalk.cyan(`'/${assetFilePath}'`)};`
    );
    log.space();
    log.space(`${chalk.magenta('export default function')} Page() {`);
    log.space(
      `  ${chalk.magenta('return')} ${chalk.cyan('<')}Video ${chalk.cyan('src=')}{${importName}} ${chalk.cyan('/>')};`
    );
    log.space(`}`);
    log.space();
  } catch (error: any) {
    log.error('Failed to adopt asset:', error.message);

    if (error.code === 'ENOENT' && error.path?.includes(dir)) {
      log.info(
        `Directory ${chalk.bold(dir)} does not exist. You may need to run ${chalk.bold.magenta('next-video init')} first.`
      );
    }
  }
}
