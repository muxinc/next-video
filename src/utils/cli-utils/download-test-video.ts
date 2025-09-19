import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { fetch } from 'undici';
import path from 'node:path';
import log from '../logger.js';
import { spawn, ChildProcess } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import type { Asset } from '../../assets.js';

export async function syncVideo(videoPath: string, videosDir: string, timeoutMs: number = 60000): Promise<boolean> {
  const videoFileName = path.basename(videoPath);
  const jsonPath = path.join(videosDir, `${videoFileName}.json`);

  // Load environment variables for the sync process
  await new Promise((resolve) => setTimeout(resolve, 100));
  config({ path: '.env.local' });

  log.info('Processing video...');

  return new Promise((resolve) => {
    let syncProcess: ChildProcess | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let watcher: any = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let isResolved = false;

    const cleanup = () => {
      if (syncProcess) {
        syncProcess.kill('SIGTERM');
        syncProcess = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (watcher) {
        watcher.close();
        watcher = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const checkVideoStatus = async (): Promise<boolean> => {
      try {
        const content = await readFile(jsonPath, 'utf-8');
        const videoData: Asset = JSON.parse(content);

        if (videoData.status === 'ready') {
          log.success('Video processed successfully!');
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve(true);
          }
          return true;
        }

        if (videoData.status === 'error') {
          log.error('Video processing failed');
          if (!isResolved) {
            isResolved = true;
            cleanup();
            resolve(false);
          }
          return true;
        }

        // Only log status changes, not every poll
        if (videoData.status !== 'uploading' && videoData.status !== 'processing') {
          log.info(`Video status: ${videoData.status}`);
        }
        return false;
      } catch (error) {
        // JSON file doesn't exist yet or is invalid, continue waiting
        return false;
      }
    };

    // Set up timeout with final check
    timeoutId = setTimeout(async () => {
      if (isResolved) return;

      log.warning('Video processing timed out, performing final check...');

      // Final check before giving up
      const isReady = await checkVideoStatus();
      if (!isReady && !isResolved) {
        log.warning('Video processing timed out');
        isResolved = true;
        cleanup();
        resolve(false);
      }
    }, timeoutMs);

    // Start the sync process
    try {
      syncProcess = spawn('npx', ['next-video', 'sync'], {
        stdio: 'pipe',
        shell: true,
      });

      syncProcess.on('error', (error) => {
        if (isResolved) return;
        log.error('Failed to start sync process:', error.message);
        isResolved = true;
        cleanup();
        resolve(false);
      });

      syncProcess.on('exit', (code) => {
        if (isResolved) return;
        if (code !== 0) {
          log.warning(`Sync process exited with code ${code}`);
          log.info('This might be because Mux credentials are not configured yet');
        }
        // Don't resolve here, let the timeout handle it
      });

      // Handle stderr output
      syncProcess.stderr?.on('data', (data) => {
        const message = data.toString();
        if (message.includes('MUX_TOKEN_ID') || message.includes('credentials')) {
          log.warning('Mux credentials not configured. Please set up your MUX_TOKEN_ID and MUX_TOKEN_SECRET');
        }
      });

      // Start polling for the JSON file
      pollInterval = setInterval(async () => {
        if (isResolved) return;
        await checkVideoStatus();
      }, 2000);
    } catch (error: any) {
      if (isResolved) return;
      log.error('Failed to start sync process:', error.message);
      isResolved = true;
      cleanup();
      resolve(false);
    }
  });
}

const TEST_VIDEO_URL = 'https://www.pexels.com/download/video/4973185/';
const TEST_VIDEO_FILENAME = 'sample-video.mp4';

export async function prepareTestVideo(videosDir: string): Promise<boolean> {
  try {
    log.info('Downloading sample video for testing...');

    const response = await fetch(TEST_VIDEO_URL);
    if (!response.ok) {
      throw new Error(`Failed to download test video: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const videoPath = path.join(videosDir, TEST_VIDEO_FILENAME);
    const writeStream = createWriteStream(videoPath);

    await pipeline(response.body, writeStream);

    log.success(`Sample video downloaded: ${TEST_VIDEO_FILENAME}`);

    // Now sync the video and wait for it to be processed
    log.info('Processing video with next-video sync...');

    try {
      const success = await syncVideo(videoPath, videosDir);

      if (success) {
        log.success('Test video processed and ready to use!');
      } else {
        log.warning('Video processing failed, but the video file is available for manual testing');
      }

      return success;
    } catch (syncError: any) {
      log.warning('Video sync process encountered an error:', syncError.message);
      log.info('The video file is available for manual testing');
      return false;
    }
  } catch (error: any) {
    log.warning('Failed to download test video:', error.message);
    log.info('You can add your own video file to test the setup');
    return false;
  }
}
