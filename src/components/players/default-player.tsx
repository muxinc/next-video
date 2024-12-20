'use client';

import { forwardRef, Suspense, Children, isValidElement } from 'react';
import Sutro from 'player.style/sutro/react';
import { getPlaybackId, getPosterURLFromPlaybackId } from '../../providers/mux/transformer.js';
import { svgBlurImage } from '../utils.js';
import Media from './media/index.js';

import type { MediaProps } from './media/index.js';
import type { PlayerProps } from '../types.js';

const DefaultPlayer = forwardRef<HTMLVideoElement, Omit<MediaProps, 'ref'> & PlayerProps>((allProps, forwardedRef) => {
  let {
    style,
    children,
    asset,
    controls = true,
    poster,
    blurDataURL,
    theme: Theme = Sutro,
    ...rest
  } = allProps;

  const slottedPoster = Children.toArray(children).find((child) => {
    return typeof child === 'object' && 'type' in child && child.props.slot === 'poster';
  });

  let slottedPosterImg;

  // If there's a slotted poster image (e.g. next/image) remove the default player poster and blurDataURL.
  if (isValidElement(slottedPoster)) {
    poster = '';
    blurDataURL = undefined;

    slottedPosterImg = slottedPoster;
    children = Children.toArray(children).filter((child) => child !== slottedPoster);
  }

  const props = rest as MediaProps & { thumbnailTime?: number };
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
          `${getPosterURLFromPlaybackId(playbackId, { ...props, width: 480 })} 480w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, width: 640 })} 640w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, width: 960 })} 960w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, width: 1280 })} 1280w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props, width: 1600 })} 1600w,` +
          `${getPosterURLFromPlaybackId(playbackId, { ...props })} 1920w`;
      }
    }
  }

  if (blurDataURL) {
    const showGeneratedBlur = !isCustomPoster && blurDataURL === asset?.blurDataURL;
    const showCustomBlur = isCustomPoster && blurDataURL !== asset?.blurDataURL;

    if (showGeneratedBlur || showCustomBlur) {
      imgStyleProps.gridArea = '1/1';
      imgStyleProps.width = '100%';
      imgStyleProps.height = '100%';
      imgStyleProps.color = 'transparent';
      imgStyleProps.backgroundSize = 'cover';
      imgStyleProps.backgroundPosition = 'center';
      imgStyleProps.backgroundRepeat = 'no-repeat';
      imgStyleProps.backgroundImage = `url('data:image/svg+xml;charset=utf-8,${svgBlurImage(blurDataURL)}')`;
    }
  }

  // Remove props that are not supported by MuxVideo.
  delete props.thumbnailTime;

  if (controls && Theme) {
    // @ts-ignore
    const dataNextVideo = props['data-next-video'];

    // The Mux player supports a poster image slot which improves the loading speed.
    if (poster) {
      slottedPosterImg = (
        <img
          slot="poster"
          src={isCustomPoster ? poster : undefined}
          srcSet={srcSet}
          style={imgStyleProps}
          decoding="async"
          aria-hidden="true"
        />
      );
      poster = '';
    }

    return (
      <Theme data-next-video={dataNextVideo} style={{
        display: 'grid',
        ...style,
      }}>
        {slottedPosterImg}
        <Suspense fallback={null}>
          <Media
            suppressHydrationWarning
            ref={forwardedRef}
            style={{
              gridArea: '1/1',
            }}
            slot="media"
            poster={poster}
            crossOrigin=""
            {...props}
          >
            {playbackId && (
              <track
                default
                kind="metadata"
                label="thumbnails"
                src={`https://image.mux.com/${playbackId}/storyboard.vtt`}
              />
            )}
            {children}
          </Media>
        </Suspense>
      </Theme>
    );
  }

  return (
    <Suspense fallback={null}>
      <Media
        suppressHydrationWarning
        ref={forwardedRef}
        style={{
          gridArea: '1/1',
          ...style,
        }}
        controls={controls === false ? undefined : true}
        poster={poster}
        crossOrigin=""
        {...props}
      >
        {playbackId && (
          <track
            default
            kind="metadata"
            label="thumbnails"
            src={`https://image.mux.com/${playbackId}/storyboard.vtt`}
          />
        )}
        {children}
      </Media>
    </Suspense>
  );
});

export default DefaultPlayer;
