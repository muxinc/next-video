import Video from 'next-video'

export default function Home() {
  return (
    <Video controls src="https://muxed.s3.amazonaws.com/ink.mp4" />
  )
}
