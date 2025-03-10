'use client';

import { forwardRef, useState } from 'react';
import DefaultPlayer from './players/default-player.js';
import { Alert } from './alert.js';
import { createVideoRequest, defaultLoader } from './video-loader.js';
import * as transformers from '../providers/transformers.js';
import {
  config,
  camelCase,
  toSymlinkPath,
  usePolling,
  isReactComponent,
  getUrlExtension,
} from './utils.js';

import type { Asset } from '../assets.js';
import type { VideoLoaderProps, VideoProps, VideoPropsInternal } from './types.js';
export type * from './types.js';

const NextVideo = forwardRef<HTMLVideoElement, VideoProps>((props, forwardedRef) => {
  // Keep in component so we can emulate the DEV_MODE.
  const DEV_MODE = process.env.NODE_ENV === 'development';

  let {
    as: VideoPlayer = DefaultPlayer,
    loader = defaultLoader,
    transform = defaultTransformer,
    className,
    style,
    src,
    width,
    height,
  } = props;

  let [asset, setAsset] = useState(typeof src === 'object' ? src : undefined);
  const [playing, setPlaying] = useState(false);

  // Required to make Next.js fast refresh when the local JSON file changes.
  // https://nextjs.org/docs/architecture/fast-refresh#fast-refresh-and-hooks
  if (typeof src === 'object') {
    asset = src;
    src = undefined;
  }

  // If the source is a string, poll the server for the JSON file.
  const loaderProps: VideoLoaderProps = { src, width, height };
  const request = createVideoRequest(loader, loaderProps, (json) => setAsset(json));

  const status = asset?.status;

  // Polling is only needed for unprocessed video sources (not HLS or DASH).
  const fileExtension = getUrlExtension(src);
  const needsPolling =
    DEV_MODE &&
    typeof src === 'string' &&
    status != 'ready' &&
    !['m3u8', 'mpd'].includes(fileExtension ?? '');

  usePolling(request, needsPolling ? 1000 : null);

  const videoProps = getVideoProps({ ...props, transform, src } as VideoPropsInternal, { asset });

  if (!isReactComponent(VideoPlayer)) {
    console.warn('The `as` property is not a valid component:', VideoPlayer);
  }

  return (
    <div className={`${className ? `${className} ` : ''}next-video-container`} style={style}>
      <style>{
        /* css */`
        .next-video-container {
          display: grid;  /* Fixes a Safari aspect-ratio + height bug. */
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
        }

        [data-next-video] {
          display: block;
          position: relative;
          width: 100%;
          height: 100%;
        }

        [data-next-video] img {
          object-fit: var(--media-object-fit, contain);
          object-position: var(--media-object-position, center);
        }
        `
      }</style>

      <VideoPlayer
        ref={forwardedRef}
        data-next-video={status ?? ''}
        style={{ width, height }}
        asset={asset}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        {...videoProps}
      ></VideoPlayer>

      {DEV_MODE && (
        <Alert hidden={Boolean(playing || !status || status === 'ready')} status={status} />
      )}
    </div>
  );
});

export function getVideoProps(allProps: VideoPropsInternal, state: { asset?: Asset }) {
  const { asset } = state;
  // Remove props that are not needed for VideoPlayer.
  const {
    controls = true,
    as,
    className,
    style,
    src,
    poster,
    blurDataURL,
    loader,
    transform,
    ...rest
  } = allProps;

  const props = {
    src: src as string | undefined,
    poster: poster as string | undefined,
    controls,
    blurDataURL,
    ...rest,
  };

  // Handle StaticImageData which are image imports that resolve to an object.
  if (typeof poster === 'object') {
    props.poster = poster.src;
    props.blurDataURL ??= poster.blurDataURL;
  }

  if (asset) {
    if (asset.status === 'ready') {
      props.blurDataURL ??= asset.blurDataURL;

      const transformedAsset = transform(asset, props);
      if (transformedAsset) {
        // src can't be overridden by the user.
        props.src = transformedAsset.sources?.[0]?.src;
        props.poster ??= transformedAsset.poster;
        props.thumbnailTime ??= transformedAsset.thumbnailTime as number;
      }
    } else {
      props.src = toSymlinkPath(asset.originalFilePath);
    }
  }

  return props;
}

function defaultTransformer(asset: Asset, props: Record<string, any>) {
  const provider = asset.provider ?? config.provider;
  for (let [key, transformer] of Object.entries(transformers)) {
    if (key === camelCase(provider)) {
      return transformer.transform(asset, props);
    }
  }
}

export default NextVideo;
