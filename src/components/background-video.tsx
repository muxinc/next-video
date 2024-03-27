'use client';

import { forwardRef } from 'react';

import { BackgroundPlayer } from './players/background-player.js';
import Video from './video.js';

import type { VideoProps } from './types.js';

const BackgroundVideo = forwardRef((props: VideoProps, forwardedRef) => {
  const { className } = props;

  return <Video
    ref={forwardedRef}
    as={BackgroundPlayer}
    thumbnailTime={0}
    className={`${className ? `${className} ` : ''}next-video-bg`}
    {...props}
  />;
});

export default BackgroundVideo;
