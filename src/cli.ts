#!/usr/bin/env node
import process from 'node:process';
import path from 'node:path';
import nextEnv from '@next/env';
import log from './logger.js';
import yargs from 'yargs/yargs';

import * as init from './cli/init.js';
import * as sync from './cli/sync.js';

nextEnv.loadEnvConfig(process.cwd(), undefined, log);

yargs(process.argv.slice(2)).command(init).command(sync).demandCommand().help().argv;

// Import the app's next.config.js file so the env variables
// __NEXT_VIDEO_OPTS set in with-next-video can be used.
import(path.resolve('next.config.js'))
  .catch(() => log.error('Failed to load next.config.js'));
