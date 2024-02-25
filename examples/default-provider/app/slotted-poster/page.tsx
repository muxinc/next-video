import Image from 'next/image';
import Video from 'next-video';
import getStarted from '/videos/get-started.mp4';
import getStartedPoster from '/images/get-started-poster.jpg';

export default function Home() {
  return (
    <>
      <main>
        <Video src={getStarted} style={{ maxWidth: 800 }}>
          <Image
            slot="poster"
            src={getStartedPoster}
            alt="Get started with Next Video"
            fill={true}
            objectFit="cover"
          />
        </Video>
      </main>
    </>
  );
}
