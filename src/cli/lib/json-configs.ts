import { readFile } from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PACKAGE_NAME } from '../../constants.js';

export function updateTSConfigFileContent(tsContents: string) {
  const newItem = 'video.d.ts';

  // Regex to find "include" array
  const includeRegex = /("include"\s*:\s*\[)([^\]]*?)(\])/;

  // Function to add "video.d.ts" to the "include" array
  const addVideoDts = (_match: string, p1: string, p2: string, p3: string) => {
    const trimmedContent = p2.trim();

    // Check if the array is multiline or inline
    if (/\r?\n/.test(p2)) {
      // Get the whitespace in front of the first item in the array
      const whitespace = p2.match(/^\s*/)?.[0] || '';

      // Multiline array
      return `${p1}${whitespace}"${newItem}",${p2}${p3}`;
    } else {
      // Inline array
      return `${p1}"${newItem}", ${trimmedContent ? `${trimmedContent}` : ''}${p3}`;
    }
  };

  // Update the tsconfig text
  const updatedContents = tsContents.replace(includeRegex, addVideoDts);

  // check if the JSON is valid before we write it back. It's ok if blows up
  // and we'll just catch/let the user know below.
  JSON.parse(updatedContents);

  return updatedContents;
}

export async function checkPackageJsonForNextVideo(packagePath: string = './package.json') {
  const pkg = await readFile(packagePath, 'utf-8');

  const json = JSON.parse(pkg);

  return !!(json.devDependencies?.[PACKAGE_NAME] || json.dependencies?.[PACKAGE_NAME]);
}

export async function getNextVideoVersion() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const scriptRoot = path.join(scriptDir, '..', '..', '..');
  const packagePath = path.join(scriptRoot, 'package.json');
  const pkg = JSON.parse(await readFile(packagePath, 'utf-8'));
  return pkg.version;
}
