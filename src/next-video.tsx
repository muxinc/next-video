'use client';

import MuxPlayer from '@mux/mux-player-react';
import type { MuxPlayerProps } from '@mux/mux-player-react';

import { Asset } from './assets.js';

interface NextVideoProps extends Omit<MuxPlayerProps, 'src'> {
  src: string | Asset;
}

export default function NextVideo(props: NextVideoProps) {
  const { src, ...rest } = props;
  const playerProps: MuxPlayerProps = rest;

  if (typeof src === 'string') {
    playerProps.src = src;
  } else {
    playerProps.playbackId = src.externalIds?.playbackId;
  }

  return <MuxPlayer {...playerProps} />;
}
