# `next-video`

Next video is a react component for adding video to your [next.js](https://github.com/vercel/next.js) application. It extends both the `<video>` element and your Next app with features for automatic video optimization.

- **Smart storage:** Store large video files outside of your git repo
- **Auto optimized**: Automatically optimize video files and deliver via CDN for better playback performance and quality
- **Customizable UI:** Choose from themes or build your own player controls
- **Posters & Previews:** Zero-config placeholder images and timeline hover thumbnails
- **Wider compatibility:** Use videos that aren’t supported natively by all browsers
- **Analytics built-in (optional):** See how often videos get watched and track video peformance
- **AI-powered:** Whisper captions coming soon...

```tsx
import Video from '@mux/next-video';
import myVideo from '/videos/myVideo.mp4';

export default function Page() {
  return <Video src={myVideo} />;
}
```

## Setup

```bash
cd your-next-app
npm install @mux/next-video
npx @mux/next-video init
```

This will create a `/videos` directory in your project which is where you will put all video source files.

It will also add a .gitignore file to the `/videos` directory that ignores video files. Videos, particularly any of reasonable size, shouldn't be stored/tracked by git. Alternatively, if you'd like to store the original files you can remove the added gitignore lines and install [git-lfs](https://git-lfs.github.com/).

### Remote storage and optimization

Vercel [recommends](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) using a dedicated content platform for video because video files are large and can lead to excessive bandwidth usage. By default, next-video uses [Mux](https://mux.com), which is built by the the creators of Video.js, powers popular streaming apps like Patreon, and whose video performance monitoring is used on the largest live events in the world.

- [Sign up for Mux](https://dashboard.mux.com/signup)
- [Create an access token](https://dashboard.mux.com/settings/access-tokens#create)
- Add environment variables to `.env.local` (or however you export local env variables)

```bash
# .env.local
MUX_TOKEN_ID=[YOUR_TOKEN_ID]
MUX_TOKEN_SECRET=[YOUR_TOKEN_SECRET]
```

### Add Next Video to `next.config.js`

```js
/** @type {import('next').NextConfig} */
const { withNextVideo } = require('@mux/next-video/process');

const nextConfig = {}; // Your current Next Config object

module.exports = withNextVideo(nextConfig);
```

## Usage

### Local videos

Add videos locally to the `/videos` directory then run `npx @mux/next-video sync`. The videos will be automatically uploaded to remote storage and optimized. You'll notice `/videos/[file-name].json` files are also created. These are used to map your local video files to the new, remote-hosted video assets. These json files must be checked into git.

```
npx @mux/next-video sync
```

You can also add `@mux/next-video sync -w` to the dev script to automatically sync videos as they're added to `/videos` while the dev server is running.

```js
// package.json
  "scripts": {
    "dev": "next dev & npx @mux/next-video sync -w",
  },
```

Now you can use the `<Video>` component in your application. Let's say you've added a file called `awesome-video.mp4` to `/videos`

```tsx
import Video from '@mux/next-video';
import awesomeVideo from '/videos/awesome-video.mp4';

export default function Page() {
  return <Video src={awesomeVideo} />;
}
```

While a video is being uploaded and processed, `<Video>` will attempt to play the local file. This only happens during local development because the local file is never uploaded to your git repo.

### Remote videos

For videos that are already hosted remotely (for example on AWS S3), set the `src` attribute to the URL of the remote file.

```tsx
import Video from '@mux/next-video';

export default function Page() {
  return <Video src="https://www.mydomain.com/remote-video.mp4" />;
}
```

If the hosted video is a single file like an MP4, the file will be automatically optimized for better deliverability and compatibility.

If the hosted file is an adaptive manifest, like HLS or DASH, NextVideo will treat the video as if it has already been optimized.

## Roadmap

### v0

- [x] Automatic video optimzation
- [x] Delivery via a CDN
- [x] Automatically upload and process local source files
- [ ] Automatically process remote hosted source files

### v1

- [ ] Customizable player
- [ ] Connectors for additional video services
- [ ] AI captions
- [ ] Kitchen sink template

## Trying it out locally

If you want to develop on this thing locally, you can clone and link this sucker. Just know...it's not a great time right now.

1. Clone this repo
1. `cd` into the repo
1. `npm install && npm run build`
1. `cd ../` (or back to wherever you want to create a test app)
1. `npx create-next-app`
1. `cd your-next-app`
1. `npx link ../next-video` (or wherever you cloned this repo)
