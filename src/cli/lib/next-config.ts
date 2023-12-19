import { builders, parseModule, loadFile, generateCode, writeFile } from 'magicast';

import fs from 'node:fs/promises';
import path from 'node:path';

import { PACKAGE_NAME } from '../../constants.js';
import { videoConfigDefault } from '../../config.js';
import type { VideoConfig } from '../../config.js';

function extensionToType(filePath: string) {
  if (filePath.endsWith('.mjs')) {
    return 'module';
  }

  return 'commonjs';
}

export default async function updateNextConfigFile(parentDir: string = './', videoConfig?: VideoConfig) {
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
    const mod = parseModule(configContents);

    // @ts-ignore
    const body = mod?.$ast?.body
    // Iterate from bottom to top.
    let i = body.length ?? 0;
    while (i--) {
      const node = body[i];
      // Replace `module.exports = something;` with `module.exports = withNextVideo(something);`
      if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
        const { left, right } = node.expression ?? {};
        if (left.type === 'MemberExpression' && left.object.type === 'Identifier' && left.object.name === 'module') {
          if (left.property.type === 'Identifier' && left.property.name === 'exports') {
            if (right.type === 'Identifier') {
              const expressionToWrap = generateCode(right).code;
              node.expression.right = wrapWithNextVideo(expressionToWrap, videoConfig).$ast;
            }
          }
        }
      }
    }

    let code =
`const { withNextVideo } = require('${path.join(PACKAGE_NAME, 'process')}')

${generateCode(mod).code}
`;

    // @ts-ignore
    await fs.writeFile(configPath, code);

    return { type, configPath };
  }

  if (type === 'module') {
    const mod = await loadFile(configPath);

    mod.imports.$add({
      from: path.join(PACKAGE_NAME, 'process'),
      imported: 'withNextVideo',
      local: 'withNextVideo',
    });

    const expressionToWrap = generateCode(mod.exports.default.$ast).code;
    mod.exports.default = wrapWithNextVideo(expressionToWrap, videoConfig);

    // @ts-ignore
    writeFile(mod, configPath);

    return { type, configPath };
  }
}

function wrapWithNextVideo(expressionToWrap: string, videoConfig?: VideoConfig) {
  if (videoConfig?.folder && videoConfig.folder !== videoConfigDefault.folder) {
    return builders.raw(`withNextVideo(${expressionToWrap}, { folder: '${videoConfig.folder}' })`);
  } else {
    return builders.raw(`withNextVideo(${expressionToWrap})`);
  }
}
