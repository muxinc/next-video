'use client';

import { forwardRef, useState } from 'react';
import { DefaultPlayer } from './default-player.js';
import { Alert } from './alert.js';
import { createVideoRequest, defaultLoader } from './video-loader.js';
import { toSymlinkPath, usePolling } from './utils.js';

import type { DefaultPlayerRefAttributes, DefaultPlayerProps } from './default-player.js';
import type { Asset } from '../assets.js';
import type { VideoLoaderProps, VideoProps } from './types.js';

const DEV_MODE = process.env.NODE_ENV === 'development';

const NextVideo = forwardRef<DefaultPlayerRefAttributes | null, VideoProps>((props: VideoProps, forwardedRef) => {
  let {
    as: VideoPlayer = DefaultPlayer,
    loader = defaultLoader,
    src,
    width,
    height,
  } = props;

  let [asset, setAsset] = useState(src);
  const [playing, setPlaying] = useState(false);

  // Required to make Next.js fast refresh when the local JSON file changes.
  // https://nextjs.org/docs/architecture/fast-refresh#fast-refresh-and-hooks
  if (typeof src === 'object') asset = src;

  // If the source is a string, poll the server for the JSON file.
  const loaderProps: VideoLoaderProps = { src: asset as string, width, height };
  const request = createVideoRequest(loader, loaderProps, (json) => setAsset(json));

  const status = typeof asset === 'object' ? asset.status : undefined;
  const needsPolling = DEV_MODE && (typeof asset === 'string' || status != 'ready');
  usePolling(request, needsPolling ? 1000 : null);

  let posterProps = getPosterProps(props, { asset });
  let videoProps = getVideoProps(props, { asset });

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

      <VideoPlayer
        ref={forwardedRef}
        data-next-video={status ?? ''}
        style={{ width, height }}
        status={status}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        {...posterProps}
        {...videoProps}
      ></VideoPlayer>

      {DEV_MODE && <Alert
        hidden={Boolean(playing || !status || status === 'ready')}
        status={status}
      />}
    </div>
  );
});

export function getVideoProps(allProps: VideoProps, state: { asset: Asset | string }) {
  const { asset } = state;
  // Remove props that are not needed for VideoPlayer.
  const {
    controls = true,
    as,
    src,
    poster,
    blurDataURL,
    loader,
    ...rest
  } = allProps;

  const props: DefaultPlayerProps = {
    controls,
    src: asset,
    ...rest
  };

  if (typeof asset === 'object') {
    if (asset.status !== 'ready') {
      props.src = toSymlinkPath(asset.originalFilePath);
    }
  }

  return props;
}

export function getPosterProps(allProps: VideoProps, state: { asset: Asset | string }) {
  const { asset } = state;
  let { poster, blurDataURL } = allProps;

  if (typeof asset === 'object') {
    if (asset.status === 'ready') {
      blurDataURL = blurDataURL ?? asset.blurDataURL;
    }
  }

  return {
    poster,
    blurDataURL,
  };
}

export default NextVideo;
