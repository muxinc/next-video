'use client';

import { forwardRef, useState } from 'react';
import DefaultPlayer from './default-player.js';
import { Alert } from './alert.js';
import { createVideoRequest, defaultLoader } from './video-loader.js';
import {  getPosterURLFromPlaybackId, toSymlinkPath, usePolling } from './utils.js';

import type { DefaultPlayerRefAttributes, DefaultPlayerProps } from './default-player.js';
import type { Asset } from '../assets.js';
import type { VideoLoaderProps, VideoProps } from './types.js';

const DEV_MODE = process.env.NODE_ENV === 'development';

const NextVideo = forwardRef<DefaultPlayerRefAttributes | null, VideoProps>((props: VideoProps, forwardedRef) => {
  let {
    as: VideoPlayer = DefaultPlayer,
    children,
    src,
    width,
    height,
    controls = true,
    loader = defaultLoader
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

  let { blurDataURL, poster, ...posterProps } = getPosterProps(props, { asset });
  let videoProps = getVideoProps(props, { asset });

  // The default player supports a poster image slot which improves the loading speed.
  if (VideoPlayer === DefaultPlayer && poster) {
    poster = '';
    children = <>
      {children}
      <img
        slot="poster"
        {...posterProps}
        style={{ backgroundImage: blurDataURL ? `url('${blurDataURL}')` : undefined }}
      />
    </>
  }

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
        poster={poster}
        style={{
          '--controls': controls === false ? 'none' : undefined,
          width,
          height,
        }}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        {...videoProps}
      >
        {children}
      </VideoPlayer>

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
    as,
    children,
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
  const props: DefaultPlayerProps = { ...rest };

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

export function getPosterProps(allProps: VideoProps, state: { asset: Asset | string }) {
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
