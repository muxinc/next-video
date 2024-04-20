import { Metadata } from 'next';
import BackgroundVideo from 'next-video/background-video';
import countryClouds from '/videos/country-clouds.mp4?thumbnailTime=0';

export const metadata: Metadata = {
  title: 'next-video - Background Video',
};

export default function Page() {
  return (
    <>
      <section>
        <BackgroundVideo
          src={countryClouds}
          disableTracking
          style={{ aspectRatio: 1.9 }}
        >
          <h1>next-video</h1>
          <p>
            A React component for adding video to your Next.js application.
            It extends both the video element and your Next app with features
            for automatic video optimization.
          </p>
        </BackgroundVideo>
      </section>
    </>
  );
}
