import { Metadata } from 'next';
import Player from 'next-video/player';

export const metadata: Metadata = {
  title: 'next-video - MP4 Source',
};

export default function Page() {
  return (
    <>
      <section>
        <Player
          style={{ width: '100%', aspectRatio: '16/9' }}
          src="https://storage.googleapis.com/muxdemofiles/mux.mp4"
          poster="https://image.mux.com/jxEf6XiJs6JY017pSzpv8Hd6tTbdAOecHTq4FiFAn564/thumbnail.webp"
          blurDataURL='data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAACwAQCdASoQAAkAAQAcJZwAAueBHFYwAP7+sPJ01xp5AM+XuhDsRQ67ZYXXhHDkrqsIkUGjQSCMuENc5y3Qg0o9pZgAAA=='
        />
      </section>
    </>
  );
}
