'use client';

// todo: fix mux-player to work with moduleResolution: 'nodenext'?
import { useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Alert } from './alert.js';
import { getPosterURLFromPlaybackId, usePolling } from './utils.js';

import type { MuxPlayerProps } from '@mux/mux-player-react';
import type { Asset } from '../assets.js';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: any;
  }
}

const DEV_MODE = process.env.NODE_ENV === 'development';
const FILES_FOLDER = 'videos/';
const API_ROUTE = '/api/video';

const toSymlinkPath = (path?: string) => {
  if (!path?.startsWith(FILES_FOLDER)) return path;
  return path?.replace(FILES_FOLDER, `_${FILES_FOLDER}`);
}

export default function NextVideo(props: VideoProps) {
  let { src, width, height, controls = true } = props;
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
      const requestUrl = new URL(API_ROUTE, window.location.href);
      requestUrl.searchParams.set('url', asset as string);
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
}

interface VideoProps extends Omit<MuxPlayerProps, 'src'> {
  src: string | Asset;
  width?: number;
  height?: number;
  controls?: boolean;
  blurDataURL?: string;

  /**
   * For best image loading performance the user should provide the sizes attribute.
   * The width of the image in the webpage. e.g. sizes="800px". Defaults to 100vw.
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#sizes
   */
  sizes?: string;
}

function getVideoProps(allProps: VideoProps, state: { asset: Asset | string }) {
  const { asset } = state;
  const {
    src,
    width,
    height,
    poster,
    blurDataURL,
    sizes,
    controls,
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
