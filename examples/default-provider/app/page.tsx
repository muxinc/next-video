import Video from 'next-video';
import getStarted from '/videos/get-started.mp4';

export default function Home() {
  return (
    <>
      <main>
        <Video src={getStarted} style={{ maxWidth: 800 }} />
      </main>
    </>
  );
}
