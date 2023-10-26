import { config } from './utils.js';
import type { Asset } from '../assets.js';
import type { VideoLoaderProps, VideoLoaderPropsWithConfig, VideoLoaderWithConfig } from './types';

export async function defaultLoader({ config, src, width, height }: VideoLoaderPropsWithConfig) {
  let requestUrl = `${config.path}?url=${encodeURIComponent(`${src}`)}`;
  if (width) requestUrl += `&w=${width}`;
  if (height) requestUrl += `&h=${height}`;
  return `${requestUrl}`;
}

export function createVideoRequest(
  loader: VideoLoaderWithConfig,
  props: VideoLoaderProps,
  callback: (json: Asset) => void
) {
  return async (abortSignal: AbortSignal) => {
    if (typeof props.src !== 'string') return;

    try {
      const requestUrl = await loader({
        ...props,
        config,
      });
      const res = await fetch(requestUrl, { signal: abortSignal });
      const json = await res.json();
      if (res.ok) {
        callback(json);
      } else {
        let message = `[next-video] The request to ${res.url} failed. `;
        message += `Did you configure the \`${config.path}\` route to handle video API requests?\n`;
        throw new Error(message);
      }
    } catch (err) {
      if (!abortSignal.aborted) {
        console.error(err)
      }
    }
  }
}
