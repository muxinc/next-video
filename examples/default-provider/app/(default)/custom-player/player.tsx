'use client';

import type { PlayerProps } from 'next-video';
import ReactPlayer from 'react-player';

export default function Player(props: PlayerProps) {
  let { asset, src, poster, blurDataURL, thumbnailTime, ...rest } = props;

  return <ReactPlayer
    src={src}
    width="100%"
    height="100%"
    {...rest}
  />;
}
