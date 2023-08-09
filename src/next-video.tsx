'use client';

import MuxPlayer from '@mux/mux-player-react';
import type { MuxPlayerProps } from '@mux/mux-player-react';
import { Asset } from './assets.js';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: any;
  }
}

interface NextVideoProps extends Omit<MuxPlayerProps, 'src'> {
  src: string | Asset;
  controls: boolean;
}

const FILES_FOLDER = 'video/files/';

const toSymlinkPath = (path?: string) => {
  return path?.replace(FILES_FOLDER, `_${FILES_FOLDER}`);
}

export default function NextVideo(props: NextVideoProps) {
  const { src, ...rest } = props;
  const playerProps: MuxPlayerProps = rest;
  let status;

  if (typeof src === 'string') {
    playerProps.src = toSymlinkPath(src);

  } else if (typeof src === 'object') {
    status = src.status;

    if (status === 'ready' && src.externalIds?.playbackId) {
      playerProps.playbackId = src.externalIds?.playbackId;

    } else {
      playerProps.src = toSymlinkPath(src.originalFilePath);
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
          '--controls': props.controls === false ? 'none' : undefined
        }}
        {...playerProps}
      />
    </>
  );
}
