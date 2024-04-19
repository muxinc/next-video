import { Metadata } from 'next';
import Image from 'next/image';
import Video from 'next-video';
import getStarted from '/videos/get-started.mp4';
import getStartedPoster from '/images/get-started-poster.jpg';

export const metadata: Metadata = {
  title: 'next-video - Slotted poster image',
};

export default function Page() {
  return (
    <>
      <section>
        <Video src={getStarted}>
          <Image
            slot="poster"
            src={getStartedPoster}
            placeholder="blur"
            alt="Get started with Next Video"
            fill={true}
            sizes="50vw"
            priority
          />
        </Video>
      </section>
    </>
  );
}
