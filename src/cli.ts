#!/usr/bin/env node
import process from 'node:process';
import nextEnv from '@next/env';
import log from './utils/logger.js';
import yargs from 'yargs/yargs';

import * as init from './cli/init.js';
import * as sync from './cli/sync.js';

nextEnv.loadEnvConfig(process.cwd(), undefined, log);

yargs(process.argv.slice(2)).command(init).command(sync).demandCommand().help().argv;
