import { Metadata } from 'next';
import Player from 'next-video/player';

export const metadata: Metadata = {
  title: 'next-video - HLS source',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          style={{ display: 'grid', width: '100%', aspectRatio: '16/9' }}
          src="https://stream.mux.com/sxY31L6Opl02RWPpm3Gro9XTe7fRHBjs92x93kiB1vpc.m3u8"
        />
      </section>
    </>
  );
}
