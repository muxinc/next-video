#!/usr/bin/env node

import { Argv, Arguments } from 'yargs';
import yargs from 'yargs/yargs';

const init = {
  command: 'init [dir]',
  desc: 'Initializes next-video in a project.',
  builder(yargs: Argv) {
    return yargs.positional('dir', {
      describe:
        'The directory to use for your video-related files (including, but not limited to, the videos themselves',
      default: 'video',
    });
  },
  handler(argv: Arguments) {
    console.log('init called for dir', argv.dir);
  },
};

yargs(process.argv.slice(2)).command(init).demandCommand().help().argv;
