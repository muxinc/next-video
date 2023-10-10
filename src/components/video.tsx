'use client';

// todo: fix mux-player to work with moduleResolution: 'nodenext'?
import { forwardRef, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Alert } from './alert.js';
import { getPosterURLFromPlaybackId, usePolling } from './utils.js';

import type { MuxPlayerRefAttributes, MuxPlayerProps } from '@mux/mux-player-react';
import type { Asset } from '../assets.js';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: any;
  }
}

export interface VideoProps extends Omit<MuxPlayerProps, 'src'> {
  /**
   * An imported video source object or a string video source URL.
   * Can be a local or remote video file.
   * If it's a string be sure to create an API endpoint to handle the request.
   */
  src: Asset | string;

  /**
   * Give a fixed width to the video.
   */
  width?: number;

  /**
   * Give a fixed height to the video.
   */
  height?: number;

  /**
   * Set to false to hide the video controls.
   */
  controls?: boolean;

  /**
   * Set a manual data URL to be used as a placeholder image before the poster image successfully loads.
   * For imported videos this will be automatically generated.
   */
  blurDataURL?: string;

  /**
   * For best image loading performance the user should provide the sizes attribute.
   * The width of the image in the webpage. e.g. sizes="800px". Defaults to 100vw.
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#sizes
   */
  sizes?: string;

  /**
   * A custom function used to resolve video URLs.
   */
  loader?: VideoLoader;
}

export type VideoLoader = (p: VideoLoaderProps) => Promise<string>;

export interface VideoLoaderProps {
  src: string;
  width?: number;
  height?: number;
}

const DEV_MODE = process.env.NODE_ENV === 'development';
const FILES_FOLDER = 'videos/';
const API_ROUTE = '/api/video';

const toSymlinkPath = (path?: string) => {
  if (!path?.startsWith(FILES_FOLDER)) return path;
  return path?.replace(FILES_FOLDER, `_${FILES_FOLDER}`);
}

const NextVideo = forwardRef<MuxPlayerRefAttributes | null, VideoProps>((props: VideoProps, forwardedRef) => {
  let {
    src,
    width,
    height,
    controls = true,
    loader = defaultLoader
  } = props;
  let [asset, setAsset] = useState(src);

  // Required to make Next.js fast refresh when the local JSON file changes.
  // https://nextjs.org/docs/architecture/fast-refresh#fast-refresh-and-hooks
  if (typeof src === 'object') asset = src;

  const status = typeof asset === 'object' ? asset.status : undefined;

  let { blurDataURL, ...posterProps } = getPosterProps(props, { asset });
  let videoProps = getVideoProps(props, { asset });

  async function fetchItems(abortSignal: AbortSignal) {
    if (typeof asset === 'object') return;

    try {
      const requestUrl = await loader({ src: asset, width, height });
      const res = await fetch(requestUrl, { signal: abortSignal });
      const json = await res.json();
      if (res.ok) {
        setAsset(json);
      } else {
        let message = `[next-video] The request to ${res.url} failed. `;
        message += `Did you configure the \`${API_ROUTE}\` route to handle video API requests?\n`;
        throw new Error(message);
      }
    } catch (err) {
      if (!abortSignal.aborted) {
        console.error(err)
      }
    }
  }

  const needsPolling = DEV_MODE && (typeof asset === 'string' || status != 'ready');
  usePolling(fetchItems, needsPolling ? 1000 : null);

  const [playing, setPlaying] = useState(false);

  return (
    <div className="next-video-container">
      <style>{
        /* css */`
        .next-video-container {
          position: relative;
          width: 100%;
        }

        [data-next-video] {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          display: inline-block;
          line-height: 0;
        }

        [data-next-video] img {
          object-fit: var(--media-object-fit, contain);
          object-position: var(--media-object-position, center);
          background: center / var(--media-object-fit, contain) no-repeat transparent;
          width: 100%;
          height: 100%;
        }
        `
      }</style>
      <MuxPlayer
        ref={forwardedRef}
        data-next-video={status ?? ''}
        poster=""
        style={{
          '--controls': controls === false ? 'none' : undefined,
          width,
          height,
        }}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        {...videoProps}
      >
        {posterProps.poster && <img
          slot="poster"
          {...posterProps}
          style={{ backgroundImage: blurDataURL ? `url('${blurDataURL}')` : undefined }} />
        }
      </MuxPlayer>
      {DEV_MODE && <Alert
        hidden={Boolean(playing || !status || status === 'ready')}
        status={status}
      />}
    </div>
  );
});

function defaultLoader({ src, width, height }: VideoLoaderProps) {
  let requestUrl = `${API_ROUTE}?url=${encodeURIComponent(src)}`;
  if (width) requestUrl += `&w=${width}`;
  if (height) requestUrl += `&h=${height}`;
  return `${requestUrl}`;
}

function getVideoProps(allProps: VideoProps, state: { asset: Asset | string }) {
  const { asset } = state;
  // Remove props that are not needed for MuxPlayer.
  const {
    src,
    width,
    height,
    poster,
    blurDataURL,
    sizes,
    controls,
    loader,
    ...rest
  } = allProps;
  const props: MuxPlayerProps = { ...rest };

  if (typeof asset === 'object') {
    let playbackId = asset.externalIds?.playbackId;

    if (asset.status === 'ready' && playbackId) {
      props.playbackId = playbackId;
    } else {
      props.src = toSymlinkPath(asset.originalFilePath);
    }
  }

  return props;
}

function getPosterProps(allProps: VideoProps, state: { asset: Asset | string }) {
  const { asset } = state;
  let { poster, blurDataURL } = allProps;
  let srcSet;

  if (typeof asset === 'object') {
    let playbackId = asset.externalIds?.playbackId;

    if (asset.status === 'ready' && playbackId) {

      if (!poster) {
        poster = getPosterURLFromPlaybackId(playbackId, allProps);
        srcSet =
          `${getPosterURLFromPlaybackId(playbackId, { ...allProps, width: 480 })} 480w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...allProps, width: 640 })} 640w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...allProps, width: 960 })} 960w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...allProps, width: 1280 })} 1280w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...allProps, width: 1600 })} 1600w,` +
          `${poster} 1920w`;
      }

      blurDataURL = blurDataURL ?? asset.blurDataURL;
    }
  }

  return {
    poster,
    srcSet,
    blurDataURL,
  };
}

export default NextVideo;
