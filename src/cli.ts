#!/usr/bin/env node
import yargs from 'yargs/yargs';

import * as init from './cli/init.js';
import * as upload from './cli/upload.js';

yargs(process.argv.slice(2)).command(init).command(upload).demandCommand().help().argv;
