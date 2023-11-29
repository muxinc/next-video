import { forwardRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { getPlaybackId, getPosterURLFromPlaybackId } from '../providers/mux/transformer.js';

import type { MuxPlayerProps, MuxPlayerRefAttributes } from '@mux/mux-player-react';
import type { PlayerProps } from './types.js';

export * from '@mux/mux-player-react';

export type DefaultPlayerRefAttributes = MuxPlayerRefAttributes;

export type DefaultPlayerProps = Omit<MuxPlayerProps, 'src'> & PlayerProps;

export const DefaultPlayer = forwardRef<DefaultPlayerRefAttributes | null, DefaultPlayerProps>((allProps: DefaultPlayerProps, forwardedRef) => {
  let {
    style,
    children,
    asset,
    controls,
    poster,
    blurDataURL,
    ...rest
  } = allProps;

  const props: MuxPlayerProps = rest;
  const imgStyleProps: React.CSSProperties = {};
  const playbackId = asset ? getPlaybackId(asset) : undefined;

  let isCustomPoster = true;
  let srcSet: string | undefined;

  if (playbackId && asset?.status === 'ready') {
    props.src = null;
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
          `${poster} 1920w`;
      }
    }
  }

  if (blurDataURL) {
    const showGeneratedBlur = !isCustomPoster && blurDataURL === asset?.blurDataURL;
    const showCustomBlur = isCustomPoster && blurDataURL !== asset?.blurDataURL;

    if (showGeneratedBlur || showCustomBlur) {
      imgStyleProps.backgroundImage = `url('${blurDataURL}')`;
    }
  }

  // The Mux player supports a poster image slot which improves the loading speed.
  if (poster) {
    children = <>
      {children}
      <img
        slot="poster"
        src={isCustomPoster ? poster : undefined}
        srcSet={srcSet}
        style={imgStyleProps}
        aria-hidden="true"
      />
    </>
    poster = '';
  }

  return (
    <MuxPlayer
      ref={forwardedRef}
      style={{
        '--controls': controls === false ? 'none' : undefined,
        ...style,
      }}
      children={children}
      poster={poster}
      {...props}
    />
  );
});
