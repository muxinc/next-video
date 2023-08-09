'use client';

import MuxPlayer from '@mux/mux-player-react';
import type { MuxPlayerProps } from '@mux/mux-player-react';

import { Asset } from './assets.js';

interface NextVideoProps extends Omit<MuxPlayerProps, 'src'> {
  src: string | Asset;
  controls: boolean;
}

export default function NextVideo(props: NextVideoProps) {
  const { src, ...rest } = props;
  const playerProps: MuxPlayerProps = rest;
  let status;

  if (typeof src === 'string') {
    playerProps.src = src;

  } else if (typeof src === 'object') {
    status = src.status;

    if (status === 'ready' && src.externalIds?.playbackId) {
      playerProps.playbackId = src.externalIds?.playbackId;

    } else {
      playerProps.src = `_${src.originalFilePath}`;
    }
  }

  return (
    <>
      <style>{
        /* css */`
        [data-next-video] {
          background-color: var(--media-background-color, #000);
          width: 100%;
          aspect-ratio: 16 / 9;
          display: inline-block;
          line-height: 0;
          position: relative;
        }
        `
      }</style>
      <MuxPlayer
        data-next-video={status}
        style={{
          '--controls': props.controls === false ? 'none' : 'revert'
        }}
        {...playerProps}
      />
    </>
  );
}
