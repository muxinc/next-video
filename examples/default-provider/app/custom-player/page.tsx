import { Metadata } from 'next';
import Video from 'next-video';
import ReactPlayer from './player'
import getStarted from '/videos/country-clouds.mp4';

export const metadata: Metadata = {
  title: 'next-video - Custom Player',
};

export default function Page() {
  return (
    <>
      <section>
        <Video as={ReactPlayer} src={getStarted} />
      </section>
    </>
  );
}
