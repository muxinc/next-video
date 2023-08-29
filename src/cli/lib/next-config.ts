import { builders, loadFile, generateCode, writeFile } from 'magicast';

import fs from 'node:fs/promises';
import path from 'node:path';

import { PACKAGE_NAME } from '../../constants.js';

const COMMON_TEMPLATE = `

// Everything below here added by the ${PACKAGE_NAME} CLI wizard.
// You should probably clean this up.

const originalConfig = module.exports;

const withNextVideo = require('${path.join(PACKAGE_NAME, 'process')}');

module.exports = withNextVideo(originalConfig);
`;

function extensionToType(filePath: string) {
  if (filePath.endsWith('.mjs')) {
    return 'module';
  }

  return 'commonjs';
}

export default async function updateNextConfigFile(parentDir: string = './') {
  let type: 'module' | 'commonjs' = 'commonjs';
  let configPath: string | undefined = undefined;
  let configContents: string = '';

  const pathsToCheck = ['next.config.js', 'next.config.mjs'];

  for (let i = 0; i < pathsToCheck.length; i++) {
    const filePath = path.join(parentDir, pathsToCheck[i]);
    let exists;
    try {
      exists = await fs.stat(filePath);
    } catch (e) {
      exists = false;
    }

    if (exists) {
      type = extensionToType(pathsToCheck[i]);
      configPath = filePath;
      configContents = await fs.readFile(filePath, 'utf-8');

      break;
    }
  }

  if (!configPath) {
    throw { error: 'not_found' };
  }

  if (configContents.includes(PACKAGE_NAME)) {
    throw { error: 'already_added' };
  }

  if (type === 'commonjs') {
    await fs.appendFile(configPath, COMMON_TEMPLATE);

    return { type, configPath };
  }

  if (type === 'module') {
    const mod = await loadFile(configPath);

    mod.imports.$add({
      from: PACKAGE_NAME,
      imported: 'withNextVideo',
      local: 'withNextVideo',
    });

    const expressionToWrap = generateCode(mod.exports.default.$ast).code;
    mod.exports.default = builders.raw(`withNextVideo(${expressionToWrap})`);

    // @ts-ignore
    writeFile(mod, configPath);

    return { type, configPath };
  }
}
