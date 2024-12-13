'use client';

import { forwardRef } from 'react';

import BackgroundPlayer from './players/background-player.js';
import Video from './video.js';

import type { VideoProps } from './types.js';
export type * from './types.js';

const BackgroundVideo = forwardRef<HTMLVideoElement, VideoProps>((props, forwardedRef) => {
  return <Video
    ref={forwardedRef}
    as={BackgroundPlayer}
    thumbnailTime={0}
    {...props}
  />;
});

export default BackgroundVideo;
