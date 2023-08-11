# `next-video`

Next video is a react component for adding video to your [next.js](https://github.com/vercel/next.js) application. It extends both the `<video>` element and your Next app with features for automatic video optimization.

- **Smart storage:** Store large video files outside of your git repo
- **Optimized quality**: Automatically optimize video files for better playback performance
- **Faster startup:** Deliver using CDNs for faster start times
- **Wider compatibility:** Use videos that aren’t supported natively by browsers
- **Posters & Previews:** Zero-config placeholder images and timeline hover thumbnails
- **Customizable UI:** Choose from themes or build your own player controls

```tsx
import myVideo from '/video/files/myVideo.mp4';
import Video from 'next-video/video';

return <Video src={myVideo} />;
```

## Setup

```bash
cd your-next-app
npm install next-video
mkdir -p video/files
```

Videos, particularly any of reasonable size, shouldn't be stored/tracked by git. We suggest adding `video/files` to your gitignore.

```bash
echo -e "/video/files\n\!/video/files/*.json" >> .gitignore
```

Alternatively, if you'd like to store the original files you can install and enable [git-lfs](https://git-lfs.github.com/).

### Set up remote storage and optimization

Vercel [recommends](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) using a dedicated content platform for video, because large videos can lead to excessive bandwidth usage. By default, next-video uses [Mux](https://mux.com), which is built by the the creators of Video.js, powers popular streaming apps like Patreon, and whose video performance monitoring is used on the largest live events in the world.

- [Sign up for Mux](https://dashboard.mux.com/signup)
- Create an access token
- Add environment variables to `.env.local`

Alternatively you can bring your own video service. See [the guide](asdf.com).

## Local videos

When you import a video file from `video/files` it will be automatically uploaded to remote storage and optimized. You'll notice `video/files/[file-name].json` files are also created. These are used to map your local video files to the new, remotely-hosted video assets. These json files must be checked into git.

Now you can use the `<Video>` component in your application. Let's say you've added a file called `awesome-video.mp4` to `video/files`

```tsx
import awesomeVideo from '/video/files/awesome-video.mp4';
import Video from 'next-video/video';

return <Video src={awesomeVideo} />;
```

While a video is being uploaded and processed, `next-video` will attempt to play the local file.

## Remote videos

For videos that are already hosted remotely (for example on AWS S3), set the `src` attribute to the URL of the remote file.

```tsx
import Video from 'next-video/video';
import remoteVideo from 'remoteVideo://www.mydomain.com/remote-video.mp4';

return <Video src={remoteVideo} />;
```

If the hosted video is a single file like an MP4, the file will be automatically optimized for better deliverability and compatibility.

If the hosted file is an adaptive manifest, like HLS or DASH, NextVideo will treat the video as if it has already been optimized.

## Roadmap

- [x] Automatic video optimzation
- [x] Delivery via a CDN
- [x] Automatically upload and process local source files
- [x] Automatically process remote hosted source files
- [ ] Customizable player
- [ ] Connectors for additional video services
- [ ] Easily allow end-users to upload video content
- [ ] Easily allow end-users to live stream from your app

## Trying it out locally

If you want to develop on this thing locally, you can clone and link this sucker. Just know...it's not a great time right now.

1. Clone this repo
1. `cd` into the repo
1. `npm install && npm run build`
1. `cd ../` (or back to wherever you want to create a test app)
1. `npx create-next-app`
1. `cd your-next-app`
1. `npx link ../next-video` (or wherever you cloned this repo)
