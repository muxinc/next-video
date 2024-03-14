import { Metadata } from 'next';
import Video from 'next-video';

export const metadata: Metadata = {
  title: 'next-video - String source',
};

export default function Page() {
  return (
    <>
      <main>
        <Video
          src="https://storage.googleapis.com/muxdemofiles/mux.mp4"
          style={{ maxWidth: 800 }}
        />
      </main>
    </>
  );
}
