# `next-video`

[![npm version](https://img.shields.io/npm/v/next-video?style=flat-square&color=informational)](http://npmjs.org/next-video)
[![NPM Downloads](https://img.shields.io/npm/dm/next-video?style=flat-square&color=informational&label=npm)](https://www.npmjs.com/package/next-video)
[![size](https://img.shields.io/bundlephobia/minzip/next-video?label=size&style=flat-square)](https://bundlephobia.com/result?p=next-video)

Next video is a react component for adding video to your [next.js](https://github.com/vercel/next.js) application. It extends both the `<video>` element and your Next app with features for automatic video optimization.

- **Smart storage:** Store large video files outside of your git repo
- **Auto optimized**: Optimize video files and deliver via CDN for better playback performance and quality
- **Customizable UI:** Choose from themes or build your own player controls
- **Posters & Previews:** Zero-config placeholder images and timeline hover thumbnails
- **Wider compatibility:** Use videos that aren’t supported natively by all browsers
- **Analytics built-in (optional):** See how often videos get watched and track video performance
- **AI-powered:** Add [auto-generated captions](https://docs.mux.com/guides/add-autogenerated-captions-and-use-transcripts?utm_source=next-video.dev) to your videos and use transcripts

```tsx
import Video from 'next-video';
import getStarted from '/videos/get-started.mp4';

export default function Page() {
  return <Video src={getStarted} />;
}
```

## Setup

### Automatic Setup

In the root of your Next.js project, run:

```bash
npx -y next-video init
```

This will (with prompting):

- install `next-video` as a dependency
- update your `next.config.js` file
- if you're using TypeScript, add types for your video file imports
- create a `/videos` directory in your project which is where you will put all video source files.

It will also update your `.gitignore` file to ignore video files in the `/videos` directory. Videos, particularly any of reasonable size, shouldn't be stored/tracked by git. Alternatively, if you'd like to store the original files you can remove the added gitignore lines and install [git-lfs](https://git-lfs.github.com/).

### Remote storage and optimization

Vercel [recommends](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) using a dedicated content platform for video because video files are large and can lead to excessive bandwidth usage. By default, next-video uses [Mux](https://mux.com?utm_source=next-video.dev) (a [video API](https://www.mux.com/video-api) for developers), which is built by the the creators of Video.js, powers popular streaming apps like Patreon, and whose video performance monitoring is used on the largest live events in the world.

- [Sign up for Mux](https://dashboard.mux.com/signup?utm_source=next-video.dev)
- [Create an access token](https://dashboard.mux.com/settings/access-tokens#create)
- Add environment variables to `.env.local` (or however you export local env variables)

```bash
# .env.local
MUX_TOKEN_ID=[YOUR_TOKEN_ID]
MUX_TOKEN_SECRET=[YOUR_TOKEN_SECRET]
```

### Manual Setup

<details>
<summary><strong>Click to see the manual init steps.</strong></summary>

#### Install the package

```bash
cd your-next-app

# If your project is using NPM (the default for Next.js)
npm install next-video

# If your project is using Yarn
yarn add next-video

# If your project is using pnpm
pnpm add next-video
```

#### Add Next Video to your Next.js config

**`next.config.js`**

If you're using CommonJS modules:

```js
const { withNextVideo } = require('next-video/process');

/** @type {import('next').NextConfig} */
const nextConfig = {}; // Your current Next Config object

module.exports = withNextVideo(nextConfig);
```

**`next.config.mjs`**

If you're using ES modules:

```js
import { withNextVideo } from 'next-video/process';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextVideo(nextConfig);
```

#### Add video import types to `tsconfig.json`

This is only required if you're using TypeScript, and makes sure your video file imports don't yell at you for missing types. `video.d.ts` should have been created in your project root when you ran `npx next-video init`, if not you can create it manually:

```ts
// video.d.ts
/// <reference types="next-video/video-types/global" />
```

Then add that file to the `include` array in `tsconfig.json`.

```js
{
  // ...
  "include": ["video.d.ts", "next-env.d.ts", /* ... */ ]
  // ...
}
```

</details>

## Usage

### Local videos ([Demo](https://next-video-demo.vercel.app/))

Add videos locally to the `/videos` directory then run `npx next-video sync`. The videos will be automatically uploaded to remote storage and optimized. You'll notice `/videos/[file-name].json` files are also created. These are used to map your local video files to the new, remote-hosted video assets. These json files must be checked into git.

```
npx next-video sync
```

You can also add `next-video sync -w` to the dev script to automatically sync videos as they're added to `/videos` while the dev server is running.

```js
// package.json
"scripts": {
  "dev": "next dev & npx next-video sync -w",
},
```

Now you can use the `<Video>` component in your application. Let's say you've added a file called `awesome-video.mp4` to `/videos`

```tsx
import Video from 'next-video';
import awesomeVideo from '/videos/awesome-video.mp4';

export default function Page() {
  return <Video src={awesomeVideo} />;
}
```

While a video is being uploaded and processed, `<Video>` will attempt to play the local file. This only happens during local development because the local file is never uploaded to your git repo.

### Remote videos

For videos that are already hosted remotely (for example on AWS S3), import the remote URL and refresh the page.
This creates a local JSON file in the `/videos` folder and the sync script will start uploading the video.

```tsx
import Video from 'next-video';
import awesomeVideo from 'https://www.mydomain.com/remote-video.mp4';

export default function Page() {
  return <Video src={awesomeVideo} />;
}
```

If the hosted video is a single file like an MP4, the file will be automatically optimized for better deliverability and compatibility.

<details>
<summary><strong>Remote videos with string source URL</strong></summary>

In some cases you might not have the remote video URL's available at the time of import.

That can be solved by creating a new API endpoint in your Next.js app for `/api/video` with the following code.

**App router (Next.js >=13)**

```js
// app/api/video/route.js
export { GET } from 'next-video/request-handler';
```

**Pages router (Next.js)**

```js
// pages/api/video/[[...handler]].js
export { default } from 'next-video/request-handler';
```

Then set the `src` attribute to the URL of the remote video, refresh the page and the video will start processing.

```tsx
import Video from 'next-video';

export default function Page() {
  return <Video src="https://www.mydomain.com/remote-video.mp4" />;
}
```

</details>

### Change player theme ([Demo](https://next-video-demo.vercel.app/custom-theme))

You can change the player theme by passing the `theme` prop to the `<Video>` component.  
See [player.style](https://player.style/) for more themes.

```tsx
import Video from 'next-video';
import Instaplay from 'player.style/instaplay/react';
import awesomeVideo from '/videos/awesome-video.mp4';

export default function Page() {
  return <Video src={awesomeVideo} theme={Instaplay} />;
}
```

### Player only ([Demo](https://next-video-demo.vercel.app/hls-source))

Since [`v1.1.0`](https://github.com/muxinc/next-video/releases/tag/v1.1.0) you can import the player component directly and use it without any upload and processing features.

```tsx
import Player from 'next-video/player';
// or
import BackgroundPlayer from 'next-video/background-player';

export default function Page() {
  return (
    <Player
      src="https://www.mydomain.com/remote-video.mp4"
      poster="https://www.mydomain.com/remote-poster.webp"
      blurDataURL="data:image/webp;base64,UklGRlA..."
    />
  );
}
```

### Custom poster and blurDataURL

You can add a custom poster and blurDataURL to the video by passing them as props.

```tsx
import Video from 'next-video';
import awesomeVideo from '/videos/awesome-video.mp4';
import awesomePoster from '../public/images/awesome-poster.jpg';

export default function Page() {
  return (
    <Video src={awesomeVideo} poster={awesomePoster.src} blurDataURL={awesomePoster.blurDataURL} />
  );
}
```

This is a good solution but it will not provide the same level of optimization
as the automatic poster and blurDataURL by the default provider.

To get the same level of optimization you can use a slotted poster element.

### Slotted poster image element ([Demo](https://next-video-demo.vercel.app/slotted-poster))

Add a slotted poster image element
(like [`next/image`](https://nextjs.org/docs/app/api-reference/components/image))
to the video by passing it as a child with a `slot="poster"` attribute.

Now your image will get all the benefits of the used image component
and it will be nicely placed behind the video player controls.

```tsx
import Image from 'next/image';
import Video from 'next-video';
import awesomeVideo from '/videos/awesome-video.mp4';
import awesomePoster from '../public/images/awesome-poster.jpg';

export default function Page() {
  return (
    <Video src={awesomeVideo}>
      <Image
        slot="poster"
        src={awesomePoster}
        placeholder="blur"
        alt="Some peeps doing something awesome"
      />
    </Video>
  );
}
```

### Custom Player ([Demo](https://next-video-demo.vercel.app/custom-player))

You can customize the player by passing a custom player component to the `as` prop.  
The custom player component accepts the following props:

- `asset`: The asset that is processed, contains useful asset metadata and upload status.
- `src`: A string video source URL if the asset is ready.
- `poster`: A string image source URL if the asset is ready.
- `blurDataURL`: A string base64 image source URL that can be used as a placeholder.

#### Example ([react-player](https://github.com/cookpete/react-player))

```tsx
import Video from 'next-video';
import ReactPlayer from './player';
import awesomeVideo from '/videos/awesome-video.mp4';

export default function Page() {
  return <Video as={ReactPlayer} src={awesomeVideo} />;
}
```

```tsx
// player.tsx
'use client';

import type { PlayerProps } from 'next-video';
import ReactPlayer from 'react-player';

export default function Player(props: PlayerProps) {
  let { asset, src, poster, blurDataURL, thumbnailTime, ...rest } = props;
  let config = { file: { attributes: { poster } } };

  return <ReactPlayer url={src} config={config} width="100%" height="100%" {...rest} />;
}
```

#### Example ([mux-player](https://www.mux.com/docs/guides/mux-player-web?utm_source=next-video.dev))

```tsx
import Video from 'next-video';
import MuxPlayer from './player';
import awesomeVideo from '/videos/awesome-video.mp4';

export default function Page() {
  return <Video as={MuxPlayer} src={awesomeVideo} />;
}
```

```tsx
// player.tsx
'use client';

import type { PlayerProps } from 'next-video';
import MuxPlayer from '@mux/mux-player-react';

export default function Player(props: PlayerProps) {
  let { asset, src, poster, blurDataURL, theme, ...rest } = props;
  const playbackId = asset?.providerMetadata?.mux?.playbackId;

  return <MuxPlayer playbackId={playbackId} {...rest} />
}
```


### Background Video ([Demo](https://next-video-demo.vercel.app/background-video))

You can use a `<BackgroundVideo>` component to add a video as a background with
no player controls. This saves about 50% of the JS player size and is optimized
for background video usage.

The `<BackgroundVideo>` component is a custom player like you saw in the previous section.

The `thumbnailTime` query parameter in the example below is used to generate
a poster image and blur up image at the specified time in the video
(limited to usage with the `mux` provider).

```tsx
import BackgroundVideo from 'next-video/background-video';
import getStarted from '/videos/country-clouds.mp4?thumbnailTime=0';

export default function Page() {
  return (
    <BackgroundVideo src={getStarted}>
      <h1>next-video</h1>
      <p>
        A React component for adding video to your Next.js application. It extends both the video
        element and your Next app with features for automatic video optimization.
      </p>
    </BackgroundVideo>
  );
}
```

### Hosting & Processing Providers

You can choose between different providers for video processing and hosting.
The default provider is [Mux](https://mux.com?utm_source=next-video.dev).
To change the provider you can add a `provider` option in the next-video config.
Some providers require additional configuration which can be passed in the `providerConfig` property.

```js
// next.config.js
const { withNextVideo } = require('next-video/process');

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withNextVideo(nextConfig, {
  provider: 'backblaze',
  providerConfig: {
    backblaze: { endpoint: 'https://s3.us-west-000.backblazeb2.com' },
  },
});
```

Supported providers with their required environment variables:

| Provider                                                     | Environment vars                                                                                          | Provider config                                                                                                                                   | Pricing link                                                             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`mux`](https://mux.com?utm_source=next-video.dev) (default) | `MUX_TOKEN_ID`<br/>`MUX_TOKEN_SECRET`                                                                     | [`videoQuality`](https://www.mux.com/docs/guides/use-video-quality-levels?utm_source=next-video.dev): `'basic' \| 'plus' \| 'premium'` (optional) | [Pricing](https://www.mux.com/pricing/video?utm_source=next-video.dev)   |
| [`vercel-blob`](https://vercel.com/docs/storage/vercel-blob) | `BLOB_READ_WRITE_TOKEN`                                                                                   |                                                                                                                                                   | [Pricing](https://vercel.com/docs/storage/vercel-blob/usage-and-pricing) |
| [`backblaze`](https://www.backblaze.com/cloud-storage)       | `BACKBLAZE_ACCESS_KEY_ID`<br/>`BACKBLAZE_SECRET_ACCESS_KEY`                                               | `endpoint`<br/>`bucket` (optional)                                                                                                                | [Pricing](https://www.backblaze.com/cloud-storage/pricing)               |
| [`amazon-s3`](https://aws.amazon.com/s3)                     | `AWS_ACCESS_KEY_ID`<br/>`AWS_SECRET_ACCESS_KEY`                                                           | `endpoint`<br/>`bucket` (optional)                                                                                                                | [Pricing](https://aws.amazon.com/s3/pricing/)                            |
| [`cloudflare-r2`](https://developers.cloudflare.com/r2/)     | `R2_ACCESS_KEY_ID`<br/>`R2_SECRET_ACCESS_KEY`<br/>`R2_CF_API_TOKEN` (optional when `bucketUrlPublic` set) | `bucket` (optional)<br/>`bucketUrlPublic` (optional when `R2_CF_API_TOKEN` set)                                                                   | [Pricing](https://developers.cloudflare.com/r2/pricing/)                 |

#### Provider feature set

|                              | Mux (default) | Vercel Blob | Backblaze | Amazon S3 | Cloudflare R2 |
| ---------------------------- | ------------- | ----------- | --------- | --------- | ------------- |
| Off-repo storage             | ✅            | ✅          | ✅        | ✅        | ✅            |
| Delivery via CDN             | ✅            | ✅          | -         | -         | ✅            |
| BYO player                   | ✅            | ✅          | ✅        | ✅        | ✅            |
| Compressed for streaming     | ✅            | -           | -         | -         |               |
| Adapt to slow networks (HLS) | ✅            | -           | -         | -         |               |
| Automatic placeholder poster | ✅            | -           | -         | -         |               |
| Timeline hover thumbnails    | ✅            | -           | -         | -         |               |
| Stream any source format     | ✅            | \*          | \*        | \*        | \*            |
| AI captions & subtitles      | ✅            | -           | -         | -         |               |
| Video analytics              | ✅            | -           | -         | -         |               |
| Pricing                      | Minutes-based | GB-based    | GB-based  | GB-based  | GB-based      |

\*Web-compatible MP4 files required for hosting providers without video processing

### Asset metadata storage hooks (callbacks)

By default the asset metadata is stored in a JSON file in the `/videos` directory.
If you want to store the metadata in a database or elsewhere you can customize
the storage hooks in a separate next-video config file.

The below example config shows the default storage hooks for the JSON file storage.

These hooks can be customized to fit your needs by changing the body of the
`loadAsset`, `saveAsset`, and `updateAsset` functions.

```js
// next-video.mjs
import { NextVideo } from 'next-video/process';
import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

export const { GET, POST, handler, withNextVideo } = NextVideo({
  // Other next-video config options should be added here if using a next-video config file.
  // folder: 'videos',
  // path: '/api/video',

  loadAsset: async function (assetPath) {
    const file = await readFile(assetPath);
    const asset = JSON.parse(file.toString());
    return asset;
  },
  saveAsset: async function (assetPath, asset) {
    try {
      await mkdir(path.dirname(assetPath), { recursive: true });
      await writeFile(assetPath, JSON.stringify(asset), {
        flag: 'wx',
      });
    } catch (err) {
      if (err.code === 'EEXIST') {
        // The file already exists, and that's ok in this case. Ignore the error.
        return;
      }
      throw err;
    }
  },
  updateAsset: async function (assetPath, asset) {
    await writeFile(assetPath, JSON.stringify(asset));
  },
});
```

Then import the `withNextVideo` function in your `next.config.mjs` file.

```js
// next.config.mjs
import { withNextVideo } from './next-video.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextVideo(nextConfig);
```

Lastly import the `GET` and `POST`, or `handler` functions in your API routes as you see fit.
The handlers expect a `url` query or body parameter with the video source URL.

These are the most minimal examples for the handlers, typically you would add
more error handling and validation, authentication and authorization.

**App router (Next.js >=13)**

```js
// app/api/video/route.js
export { GET, POST } from '@/next-video';
```

**Pages router (Next.js)**

```js
// pages/api/video/[[...handler]].js
export { handler as default } from '@/next-video';
```

## Default Player

The default player is built with [Media Chrome](https://github.com/muxinc/media-chrome).

- The default theme is [Sutro](https://player.style/themes/sutro) by Mux.
- The video engine changes automatically based on the source format:
  - Video files (like MP4, MP3, WEBM) that are progressively downloaded are played with the native `<video>` element.
  - Mux videos are played with [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video).
  - HLS streams are played with [`<hls-video>`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element).
  - DASH streams are played with [`<dash-video>`](https://github.com/muxinc/media-elements/tree/main/packages/dash-video-element).

### Props

The `<Video>` component accepts all the props of the `<video>` element and the following additional props:

- `src` (Asset | string): The video asset object (import) or source URL.
- `poster` (StaticImageData | string): A placeholder image for the video. (Auto generated for Mux videos)
- `blurDataURL` (string): A base64 image source URL that can be used as a placeholder. (Auto generated for Mux videos)
- `theme` (React Component): The player theme component. See [player.style](https://player.style/) for more themes.
- `as` (React Component): A custom player component. See [Custom player](#custom-player-demo).
- `transform` (function): A custom function to transform the asset object (src and poster).
- `loader` (function): A custom function used to resolve string based video URLs (not imports).

#### Mux video props

The `<Video>` component with a Mux video source accepts the following additional props:

- `startTime` (number): The start time of the video in seconds.
- `streamType` ("on-demand" | "live"): The stream type of the video. Default is "on-demand".
- `customDomain` (string): Assigns a custom domain to be used for Mux Video.
- `beaconCollectionDomain` (string): Assigns a custom domain to be used for Mux Data collection. NOTE: Must be set before playbackId to apply to Mux Data monitoring.
- `envKey` (string): This is the environment key for Mux Data. If you use Mux video this is automatically
  set for you. If you use a different provider you can set this to your own key.
- `disableTracking` (boolean): Disables Mux data tracking of video playback.
- `disableCookies` (boolean): Disables cookies used by Mux Data.
- `preferPlayback` ("mse" | "native"): Specify if `<mux-video>` should try to use Media Source Extension or native playback (if available). If no value is provided, `<mux-video>` will choose based on what's deemed optimal for content and playback environment.
- `maxResolution` ("720p" | "1080p" | "1440p" | "2160p"): Specify the maximum resolution you want delivered for this video.
- `minResolution` ("480p" | "540p" | "720p" | "1080p" | "1440p" | "2160p"): Specify the minimum resolution you want delivered for this video.
- `programStartTime` (number): Apply PDT-based [instant clips](https://docs.mux.com/guides/create-instant-clips) to the beginning of the media stream.
- `programEndTime` (number): Apply PDT-based [instant clips](https://docs.mux.com/guides/create-instant-clips) to the end of the media stream.
- `assetStartTime` (number): Apply media timeline-based [instant clips](https://docs.mux.com/guides/create-instant-clips) to the beginning of the media stream.
- `assetEndTime` (number): Apply media timeline-based [instant clips](https://docs.mux.com/guides/create-instant-clips) to the end of the media stream.
- `renditionOrder` (string): Change the order in which renditions are provided in the src playlist. Can impact initial segment loads. Currently only support "desc" for descending order.
- `metadataVideoId` (string): This is an arbitrary ID sent to Mux Data that should map back to a record of this video in your database.
- `metadataVideoTitle` (string): This is an arbitrary title for your video that will be passed in as metadata into Mux Data. Adding a title will give you useful context in your Mux Data dashboard. (optional, but encouraged)
- `metadataViewerUserId` (string): If you have a logged-in user, this should be an anonymized ID value that maps back to the user in your database that will be sent to Mux Data. Take care to not expose personal identifiable information like names, usernames or email addresses. (optional, but encouraged)
- `metadata*` (string): This metadata\* syntax can be used to pass any arbitrary Mux Data metadata fields.
- `playbackToken` (string): The playback token for signing the `src` URL.
- `thumbnailToken` (string): The token for signing the `poster` URL.
- `storyboardToken` (string): The token for signing the storyboard URL.
- `drmToken` (string): The token for signing DRM license and related URLs.
- `targetLiveWindow` (number): An offset representing the seekable range for live content, where `Infinity` means the entire live content is seekable (aka "standard DVR"). Used along with `streamType` to determine what UI/controls to show.
- `liveEdgeOffset` (number): The earliest playback time that will be treated as playing "at the live edge" for live content.
- `debug` (boolean): Enables debug mode for the underlying playback engine (currently hls.js) and mux-embed, providing additional information in the console.


#### Styling the default player

The default theme is [Sutro](https://player.style/themes/sutro) which can be styled with CSS variables.
If you are looking to completely change the layout and style it's recommended to [change the `theme` prop](#change-player-theme-demo) to a different theme or create a new theme.

**CSS Variables**: The default theme uses CSS variables for many colors, so you can override them in your CSS.

- `--media-primary-color`: The color of the control icons.
- `--media-secondary-color`: The background color of the control when hovered.
- `--media-accent-color`: The color of the volume slider and time slider.

For example:

```tsx
import Video from 'next-video';
import getStarted from '/videos/get-started.mp4';

export default function Page() {
  return <Video src={getStarted} style={{
    '--media-primary-color': '#fdaff3',
    '--media-secondary-color': '#ff0088',
    '--media-accent-color': '#42ffe0',
  }} />;
}
```

This is just the tip of the iceberg. For a full list of CSS variables, check out the [Media Chrome styling docs](https://www.media-chrome.org/docs/en/reference/styling)


## Required Permissions for Amazon S3

<details>
<summary>If you're using Amazon S3 as the provider, you'll need to create a new IAM user with the following permissions:</summary>

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListAllMyBuckets", "s3:CreateBucket", "s3:PutBucketOwnershipControls"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutBucketPublicAccessBlock",
        "s3:PutBucketAcl",
        "s3:PutBucketCORS",
        "s3:GetObject",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::next-videos-*"
    }
  ]
}
```

</details>

## Cloudflare R2 Bucket Public Access

<details>
<summary>By default, Cloudflare R2 Buckets are not publicly accessible. To enable public access, you must ensure one of the following:</summary>

1. Configure the Bucket for Public Access:

   - Provide a `bucket` Name in the provider configuration and ensure it is configured for public access
   - Specify the public URL in the provider configuration under the `bucketUrlPublic` key
   - For detailed instructions, refer to the Cloudflare documentation:
     https://developers.cloudflare.com/r2/buckets/public-buckets/

2. Provide a Cloudflare API Key:
   - You can specify a Cloudflare API Key with R2 Admin read & write permissions using the environment variable: `R2_CF_API_TOKEN`
   - This API Key will allow the provider to enable public access for the bucket and retrieve the public URL using the Cloudflare API
   - You don't need to create a bucket manually
   - To create an API Token, visit:
   https://dash.cloudflare.com/?to=/:account/r2/api-tokens
   </details>

## Roadmap

### v0

- [x] Automatic video optimization
- [x] Delivery via a CDN
- [x] Automatically upload and process local source files
- [x] Automatically process remote hosted source files

### v1

- [x] Customizable player
- [x] Connectors for additional video services
- [x] AI captions

## Trying it out locally

If you want to develop on this thing locally, you can clone and link this sucker. Just know...it's not a great time right now.

1. Clone this repo
1. `cd` into the repo
1. `npm install && npm run build`
1. `cd ../` (or back to wherever you want to create a test app)
1. `npx create-next-app`
1. `cd your-next-app`
1. `npx link ../next-video` (or wherever you cloned this repo)
