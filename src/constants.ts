import path from 'node:path';

export const VIDEO_PATH = path.join(process.cwd(), '/video');
export const CONFIG_PATH = path.join(VIDEO_PATH, '/assets.json');
export const FILES_PATH = path.join(VIDEO_PATH, '/files');
