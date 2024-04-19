'use client';

import type { PlayerProps } from 'next-video';
import ReactPlayer from 'react-player';

export default function Player(props: PlayerProps) {
  let { asset, src, poster, blurDataURL, thumbnailTime, ...rest } = props;
  let config = { file: { attributes: { poster } } };

  return <ReactPlayer
    url={src}
    config={config}
    width="100%"
    height="100%"
    {...rest}
  />;
}
