import { Metadata } from 'next';
import Video from 'next-video';
import Instaplay from 'player.style/instaplay/react';
import getStarted from '/videos/get-started.mp4?thumbnailTime=0';

export const metadata: Metadata = {
  title: 'next-video - Custom theme',
};

export default function Page() {
  return (
    <>
      <section>
        <Video src={getStarted} theme={Instaplay}>
          <track kind="captions" src="/get-started.vtt" srcLang="en" label="English" default />
        </Video>
      </section>
    </>
  );
}
