import { forwardRef, lazy } from 'react';
import { getUrlExtension } from '../../utils.js';
import type { MuxMediaProps } from '@mux/playback-core';
import type MuxVideoComponent from '@mux/mux-video/react';
import type HlsVideoComponent from 'hls-video-element/react';
import type DashVideoComponent from 'dash-video-element/react';

export type MuxVideoProps = Omit<MuxMediaProps, 'preload'> & Omit<React.ComponentProps<'video'>, 'autoPlay'>;

export type NativeVideoProps = Omit<React.ComponentPropsWithoutRef<'video'>, 'preload' | 'width' | 'height'>;

export type MediaProps<TPlaybackId = string | undefined> = TPlaybackId extends string
  ? MuxVideoProps & { playbackId?: TPlaybackId }
  : NativeVideoProps & { playbackId?: undefined };

let MuxVideo: React.LazyExoticComponent<typeof MuxVideoComponent>;
let HlsVideo: React.LazyExoticComponent<typeof HlsVideoComponent>;
let DashVideo: React.LazyExoticComponent<typeof DashVideoComponent>;

const Media = forwardRef<any, MediaProps>((props, forwardedRef) => {

  if (typeof props.playbackId === 'string') {
    MuxVideo ??= lazy(() => import('@mux/mux-video/react'));
    // @ts-expect-error
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
