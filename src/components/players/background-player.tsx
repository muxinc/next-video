'use client';

import { forwardRef, Children, isValidElement, useState } from 'react';

import type { Props as MuxVideoProps } from '@mux/mux-video-react';
import type { DefaultPlayerProps } from './default-player.js';

import MuxVideo from '@mux/mux-video-react';
import { getPlaybackId, getPosterURLFromPlaybackId } from '../../providers/mux/transformer.js';
import { svgBlurImage } from '../utils.js';

export type BackgroundPlayerProps = Omit<DefaultPlayerProps, 'src'>;

export const BackgroundPlayer = forwardRef((allProps: BackgroundPlayerProps, forwardedRef: any) => {
  let {
    style,
    children,
    asset,
    controls,
    poster,
    blurDataURL,
    onPlaying,
    onLoadStart,
    thumbnailTime,
    ...rest
  } = allProps;

  const slottedPoster = Children.toArray(children).find((child) => {
    return typeof child === 'object' && 'type' in child && child.props.slot === 'poster';
  });

  // If there's a slotted poster image (e.g. next/image) remove the default player poster and blurDataURL.
  if (isValidElement(slottedPoster)) {
    poster = '';
    blurDataURL = undefined;
  }

  const props = rest as MuxVideoProps;
  const imgStyleProps: React.CSSProperties = {};
  const playbackId = asset ? getPlaybackId(asset) : undefined;

  let isCustomPoster = true;
  let srcSet: string | undefined;

  if (playbackId && asset?.status === 'ready') {
    props.src = undefined;
    props.playbackId = playbackId;

    if (poster) {
      isCustomPoster = poster !== getPosterURLFromPlaybackId(playbackId, props);

      if (!isCustomPoster) {
        // If it's not a custom poster URL, optimize with a srcset.
        srcSet =
          `${getPosterURLFromPlaybackId(playbackId, { ...props, thumbnailTime, width: 480 })} 480w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, thumbnailTime, width: 640 })} 640w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, thumbnailTime, width: 960 })} 960w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, thumbnailTime, width: 1280 })} 1280w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, thumbnailTime, width: 1600 })} 1600w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, thumbnailTime })} 1920w`;
      }
    }
  }

  if (blurDataURL) {
    const showGeneratedBlur = !isCustomPoster && blurDataURL === asset?.blurDataURL;
    const showCustomBlur = isCustomPoster && blurDataURL !== asset?.blurDataURL;

    if (showGeneratedBlur || showCustomBlur) {
      imgStyleProps.color = 'transparent';
      imgStyleProps.backgroundSize = 'cover';
      imgStyleProps.backgroundPosition = 'center';
      imgStyleProps.backgroundRepeat = 'no-repeat';
      imgStyleProps.backgroundImage = `url('data:image/svg+xml;charset=utf-8,${svgBlurImage(blurDataURL)}')`;
    }
  }

  let videoPoster;
  if (poster) {
    videoPoster = '';
  }

  const [posterHidden, setPosterHidden] = useState(false);

  return (
    <>
      <style>{
        /* css */`
        .next-video-bg {
          aspect-ratio: initial;
          height: 100%;
          place-items: center;
        }

        .next-video-bg-poster,
        .next-video-bg-text,
        .next-video-bg [data-next-video] {
          position: relative;
          grid-area: 1 / 1;
        }

        .next-video-bg-poster {
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }

        .next-video-bg-poster[hidden] {
          display: none;
        }

        .next-video-bg [data-next-video] {
          object-fit: cover;
        }

        .next-video-bg-text {
          padding: 5% 5% 10%;
        }
        `
      }</style>
      <MuxVideo
        ref={forwardedRef}
        style={{ ...style }}
        poster={videoPoster}
        onPlaying={(event) => {
          onPlaying?.(event as any);
          setPosterHidden(true);
        }}
        onLoadStart={(event) => {
          onLoadStart?.(event as any);
          setPosterHidden(false);
        }}
        muted={true}
        autoPlay={true}
        loop={true}
        {...props}
      />
      {poster && (
        <img
          className="next-video-bg-poster"
          src={isCustomPoster ? poster : undefined}
          srcSet={srcSet}
          style={imgStyleProps}
          hidden={posterHidden}
          decoding="async"
          aria-hidden="true"
        />
      )}
      <div className="next-video-bg-text">{children}</div>
    </>
  );
});
