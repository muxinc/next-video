import React from 'react';
// @ts-ignore
import videoAssets from '/video/assets.json';

function Video(props) {

  const defaultPlaybackId = videoAssets.data?.[props.src]?.playbackId;
  const { src, playbackId = defaultPlaybackId, ...rest } = props;

  if (typeof window === 'undefined') {
    console.log(src);
    let count = 0;
    setInterval(() => {
      console.log(++count);
    }, 1000);
  }

  return React.createElement('video', {
    src,
    ...rest
  });
}

export default Video;
