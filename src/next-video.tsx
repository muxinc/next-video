'use client';
// import the asset json db thing here
import { Asset } from './assets';
import MuxPlayer from '@mux/mux-player-react';

interface NextVideoProps {
  src: string | Asset;
}

export default function NextVideo(props: NextVideoProps) {
  if (typeof props.src === 'string') {
    return <video src={props.src} />;
  }

  return <MuxPlayer playbackId={props.src.externalIds?.playbackId} />;
}
