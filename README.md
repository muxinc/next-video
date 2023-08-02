# `next-video`

Next video is a react component for adding video to your [next.js](https://github.com/vercel/next.js) application. It extends the `<video>` element with features for automatic video optimization.
* **Smart storage:** Store large video files outside of your git repo
* **Optimized quality**: Automatically optimize video files for better playback performance
* **Faster startup:** Deliver using CDNs for faster start times
* **Wider compatibility:** Use videos that aren’t supported natively by browsers
* **Posters & Previews:** Zero-config placeholder images and timeline hover thumbnails
* **Customizable UI:** Choose from themes or build your own player controls

```jsx
<NextVideo src="/video/files/myVideo.mp4">
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
Vercel [recommends](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) using a dedicated content platform for video, because large videos can lead to excessive bandwidth usage. By default, next-video uses [Mux](https://mux.com), which is built by the the creators of video.js, powers popular streaming apps like Patreon, and whose video performance monitoring is used on largest live events in the world.
* [Sign up for Mux](https://dashboard.mux.com/signup)
* Create an access token
* Add environment variables to `.env.local`

Alternatively you can bring your own lame ass video service. See [the guide](asdf.com).
## Local videos
When you are running `next dev` and add videos to `video/files` they will be automatically uploaded to remote storage and optimized. You'll notice `video/files/[file-name].json` files are also created. These are used to map your local video files to the new, remotely-hosted video assets. These files must be checked into git.

Now you can use the `<NextVideo>` component in your application. Let's say you've added a file called `awesome-video.mp4` to `video/files`

```tsx
import NextVideo from 'next-video';

<NextVideo src="/video/files/awesome-video.mp4" />
```

While a video is being uploaded and processed, `<NextVideo>` will attempt to play the local file.

## Remote videos
For videos that are already hosted remotely (for example on AWS S3), set the `src` attribute to the URL of the remove file. 

```jsx
import NextVideo from 'next-video';

<NextVideo src="https://my-domain.com/awesome-video.mp4" />
```

If the hosted video is a single file like an MP4, the file will be automatically optimized for better deliverability and compatibility.

If the hosted file is an adaptive manifest, like HLS or DASH, NextVideo will treat the video as if it has already been optimized.
