import { Metadata } from 'next';
import Video from 'next-video';
import getStarted from '/videos/get-started.mp4?thumbnailTime=37';

export const metadata: Metadata = {
  title: 'next-video - Basic example',
};

export default function Page() {
  return (
    <>
      <section>
        <Video
          src={getStarted}
          streamType='on-demand'
          metadata={{
            video_id: 'next-video-intro',
            video_title: 'next-video intro',
          }}
        >
          <track kind="captions" src="/get-started.vtt" srcLang="en" label="English" default />
        </Video>
      </section>
    </>
  );
}
