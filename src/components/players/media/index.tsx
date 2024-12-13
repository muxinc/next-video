import { forwardRef, lazy } from 'react';
import { getUrlExtension } from '../../utils.js';
import type MuxVideoComponent from './mux-video-react.js';
import type { MuxVideoProps } from './mux-video-react.js';
import type HlsVideoComponent from 'hls-video-element/react';
import type DashVideoComponent from 'dash-video-element/react';

export type NativeVideoProps = React.ComponentPropsWithoutRef<'video'>;
export type { MuxVideoProps };

export type MediaProps<TPlaybackId = string | undefined> = TPlaybackId extends string
  ? MuxVideoProps & { playbackId?: TPlaybackId }
  : NativeVideoProps & { playbackId?: undefined };

let MuxVideo: React.LazyExoticComponent<typeof MuxVideoComponent>;
let HlsVideo: React.LazyExoticComponent<typeof HlsVideoComponent>;
let DashVideo: React.LazyExoticComponent<typeof DashVideoComponent>;

const Media = forwardRef<HTMLVideoElement, MediaProps>((props, forwardedRef) => {

  if (typeof props.playbackId === 'string') {
    MuxVideo ??= lazy(() => import('./mux-video-react.js'));
    return <MuxVideo ref={forwardedRef} {...props} controls={false} />;
  }

  const fileExtension = getUrlExtension(props.src);

  if (fileExtension === 'm3u8') {
    HlsVideo ??= lazy(() => import('hls-video-element/react'));
    return <HlsVideo ref={forwardedRef} {...props} controls={false} />;
  }

  if (fileExtension === 'mpd') {
    DashVideo ??= lazy(() => import('dash-video-element/react'));
    return <DashVideo ref={forwardedRef} {...props} controls={false} />;
  }

  return <video ref={forwardedRef} {...props} controls={false} />;
});

export default Media;
