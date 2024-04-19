import { Metadata } from 'next';
import Video from 'next-video';
import getStarted from '/videos/get-started.mp4?thumbnailTime=35';

export const metadata: Metadata = {
  title: 'next-video - Basic example',
};

export default function Page() {
  return (
    <>
      <section>
        <Video src={getStarted}>
          <track kind="captions" src="/get-started.vtt" srcLang="en" label="English" default />
        </Video>
      </section>
    </>
  );
}
