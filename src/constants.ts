import path from 'node:path';
import fs from 'node:fs/promises';

const packageJsonContents = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8');
const packageJson = JSON.parse(packageJsonContents);

export const VIDEOS_PATH = path.join(process.cwd(), '/videos');
export const PACKAGE_NAME = packageJson.name;
