'use client';

import { forwardRef, Suspense, lazy, Children, isValidElement } from 'react';
import { getPlaybackId, getPosterURLFromPlaybackId } from '../../providers/mux/transformer.js';
import { getUrlExtension, svgBlurImage } from '../utils.js';

import DefaultTheme from './default-theme.js';
import type { Props as MuxVideoProps } from './mux-video-react.js';
import type { PlayerProps } from '../types.js';

export type DefaultPlayerProps = Omit<MuxVideoProps, 'ref' | 'src'> & PlayerProps;

let MuxVideo;

const DefaultPlayer = forwardRef((allProps: DefaultPlayerProps, forwardedRef: any) => {
  let {
    style,
    children,
    asset,
    controls,
    poster,
    blurDataURL,
    theme: Theme = DefaultTheme,
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

  const props = rest as MuxVideoProps & { thumbnailTime?: number };
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

  let Video = (props: any) => <video {...props} />;
  const fileExtension = getUrlExtension(props.src);

  if (playbackId || ['m3u8', 'mpd'].includes(fileExtension ?? '')) {
    MuxVideo ??= lazy(() => import('./mux-video-react.js'));
    Video = MuxVideo;
  }

  if (controls && Theme) {
    // @ts-ignore
    const dataNextVideo = props['data-next-video'];

    let slottedPosterImg;
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
      <Theme style={style} data-next-video={dataNextVideo}>
        {slottedPosterImg}
        <Suspense fallback={null}>
          <Video
            suppressHydrationWarning
            ref={forwardedRef}
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
          </Video>
        </Suspense>
      </Theme>
    );
  }

  return (
    <Suspense fallback={null}>
      <Video
        suppressHydrationWarning
        ref={forwardedRef}
        style={style}
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
      </Video>
    </Suspense>
  );
});

export default DefaultPlayer;
