'use client';

import { forwardRef } from 'react';

import BackgroundPlayer from './players/background-player.js';
import Video from './video.js';

import type { VideoProps } from './types.js';

const BackgroundVideo = forwardRef((props: VideoProps, forwardedRef) => {
  return <Video
    ref={forwardedRef}
    as={BackgroundPlayer}
    thumbnailTime={0}
    {...props}
  />;
});

export default BackgroundVideo;
