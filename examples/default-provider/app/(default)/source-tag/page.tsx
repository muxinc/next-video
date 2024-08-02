import { Metadata } from 'next';
import Player from 'next-video/player';

export const metadata: Metadata = {
  title: 'next-video - Player only',
};

export default function Page() {
  return (
    <>
      <section>
        <Player style={{ display: 'grid', width: '100%', aspectRatio: 1.9 }}>
          <source src="/country-clouds" type="video/mp4" />
        </Player>
      </section>
    </>
  );
}
