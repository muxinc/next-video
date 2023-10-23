import { forwardRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { getPosterURLFromPlaybackId } from './utils.js';

import type { MuxPlayerProps, MuxPlayerRefAttributes } from '@mux/mux-player-react';
import type { PlayerProps } from './types.js';

export * from '@mux/mux-player-react';

export type DefaultPlayerRefAttributes = MuxPlayerRefAttributes;

export type DefaultPlayerProps = Omit<MuxPlayerProps, 'src'> & PlayerProps;

export const DefaultPlayer = forwardRef<DefaultPlayerRefAttributes | null, DefaultPlayerProps>((allProps: DefaultPlayerProps, forwardedRef) => {
  let {
    style,
    children,
    status,
    controls,
    poster,
    blurDataURL,
    src,
    ...rest
  } = allProps;

  let props: MuxPlayerProps = rest;
  let srcSet: string | undefined;

  if (typeof src === 'string') {
    props.src = src;
  }
  else if (typeof src === 'object') {

    const playbackId = src.externalIds?.playbackId;

    if (src.status === 'ready' && playbackId) {

      props.playbackId = playbackId;

      if (!poster) {
        poster = getPosterURLFromPlaybackId(playbackId, props);
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

  // The Mux player supports a poster image slot which improves the loading speed.
  if (poster) {
    poster = '';
    children = <>
      {children}
      <img
        slot="poster"
        srcSet={srcSet}
        style={{ backgroundImage: blurDataURL ? `url('${blurDataURL}')` : undefined }}
      />
    </>
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
