# `next-video`

The easiest way to get started with video in your Next.js application. This library will automatically upload your videos to Mux and serve them from their CDN.

## Setup

```bash
cd your-next-app
npm install next-video
mkdir -p video/files
```

Videos, particularly any of reasonable size, shouldn't be stored/tracked by git. We suggest adding `video/files` to your gitignore, but if you'd like to store the original files you can install and enable [git-lfs](https://git-lfs.github.com/).

```bash
echo "/video/files" >> .gitignore
```

As you use `next-video` you'll notice a `video/assets.json` file is created/updated. This file is used to map your local video files to their Mux assets. This file must be checked into git.

## Usage

Now you can just use `next-video` in your application! Let's say you've added a file called `awesome-video.mp4` to `video/files`

```tsx
import NextVideo from 'next-video';

<NextVideo src="/video/files/awesome-video.mp4" />
```

Any time you use the `NextVideo` component, it will check to see if the video has been uploaded to Mux. If it hasn't, it will upload it for you. If it has, it will use the Mux asset instead of the local file. If the local file is playable directly, it will be used until the upload is complete.
