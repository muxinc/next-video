import { Metadata } from 'next';
import Video from 'next-video';
import ReactPlayer from './player'
import countryClouds from '/videos/country-clouds.mp4';

export const metadata: Metadata = {
  title: 'next-video - Custom Player',
};

export default function Page() {
  return (
    <>
      <section>
        <Video
          as={ReactPlayer}
          src={countryClouds}
          style={{ aspectRatio: 1.9 }}
        />
      </section>
    </>
  );
}
