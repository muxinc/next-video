import { Metadata } from 'next';
import Player from 'next-video/player';

export const metadata: Metadata = {
  title: 'next-video - DASH source',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          style={{ display: 'grid', width: '100%', aspectRatio: '16/9' }}
          src="https://player.vimeo.com/external/648359100.mpd?s=a4419a2e2113cc24a87aef2f93ef69a8e4c8fb0c"
        />
      </section>
    </>
  );
}
