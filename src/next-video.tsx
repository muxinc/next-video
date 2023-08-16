'use client';

// todo: fix mux-player to work with moduleResolution: 'nodenext'?
// @ts-ignore
import MuxPlayer from '@mux/mux-player-react';
// @ts-ignore
import type { MuxPlayerProps } from '@mux/mux-player-react';
import { useState } from 'react';
import { Asset } from './assets.js';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: any;
  }
}

interface NextVideoProps extends Omit<MuxPlayerProps, 'src'> {
  src: string | Asset;
  controls: boolean;
}

const DEV_MODE = process.env.NODE_ENV === 'development';
const FILES_FOLDER = 'video/files/';

const toSymlinkPath = (path?: string) => {
  return path?.replace(FILES_FOLDER, `_${FILES_FOLDER}`);
}

export default function NextVideo(props: NextVideoProps) {
  const { src, ...rest } = props;
  const playerProps: MuxPlayerProps = rest;
  let status: string | undefined;

  if (typeof src === 'string') {
    playerProps.src = toSymlinkPath(src);

  } else if (typeof src === 'object') {
    status = src.status;

    if (status === 'ready' && src.externalIds?.playbackId) {
      playerProps.playbackId = src.externalIds?.playbackId;

    } else {
      playerProps.src = toSymlinkPath(src.originalFilePath);
    }
  }

  const [playing, setPlaying] = useState(false);

  return (
    <div className="next-video-container">
      <style>{
        /* css */`
        .next-video-container {
          position: relative;
        }

        [data-next-video] {
          background-color: var(--media-background-color, #000);
          width: 100%;
          aspect-ratio: 16 / 9;
          display: inline-block;
          line-height: 0;
          position: relative;
        }
        `
      }</style>
      <MuxPlayer
        data-next-video={status}
        style={{
          '--controls': props.controls === false ? 'none' : undefined
        }}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        {...playerProps}
      />
      {DEV_MODE && <Alert
        hidden={Boolean(playing || (status && status === 'ready'))}
        status={status}
      />}
    </div>
  );
}

interface AlertProps {
  status?: string
  hidden?: boolean
}

function Alert({ status, hidden }: AlertProps) {

  let message: string = '';

  switch (status) {
    case 'error':
      message = 'An error occurred while uploading your video. Please check the CLI logs for more info.';
      break;
    default:
      message = 'Your video file is being uploaded. The current loaded video is the source file.';
      break;
  }

  return (
    <>
      <style>{
        /* css */`
        .alert {
          position: absolute;
          inset: 1em;
          bottom: auto;
          padding: .75rem 1rem;
          border-radius: 1rem;
          background-color: hsl(240 10% 3.9% / .7);
          border: 1px solid hsl(240 3.7% 15.9%);
          transition: visibility 0s, opacity .25s;
          visibility: visible;
          opacity: 1;
        }

        .alert[hidden] {
          display: block;
          transition: visibility 1s, opacity 1s;
          visibility: hidden;
          opacity: 0;
        }

        .alert svg {
          position: absolute;
        }

        .alert h5 {
          line-height: 1;
          font-weight: 500;
          margin-bottom: 0.25rem;
          padding-left: 1.75rem;
          font-size: inherit;
        }

        .alert div {
          padding-left: 1.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        `
      }</style>
      <div role="alert" className={`alert alert-${status}`} hidden={hidden}>
        {status === 'error'
          ? <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704ZM9.85358 5.14644C10.0488 5.3417 10.0488 5.65829 9.85358 5.85355L8.20713 7.49999L9.85358 9.14644C10.0488 9.3417 10.0488 9.65829 9.85358 9.85355C9.65832 10.0488 9.34173 10.0488 9.14647 9.85355L7.50002 8.2071L5.85358 9.85355C5.65832 10.0488 5.34173 10.0488 5.14647 9.85355C4.95121 9.65829 4.95121 9.3417 5.14647 9.14644L6.79292 7.49999L5.14647 5.85355C4.95121 5.65829 4.95121 5.3417 5.14647 5.14644C5.34173 4.95118 5.65832 4.95118 5.85358 5.14644L7.50002 6.79289L9.14647 5.14644C9.34173 4.95118 9.65832 4.95118 9.85358 5.14644Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
          : <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M8.4449 0.608765C8.0183 -0.107015 6.9817 -0.107015 6.55509 0.608766L0.161178 11.3368C-0.275824 12.07 0.252503 13 1.10608 13H13.8939C14.7475 13 15.2758 12.07 14.8388 11.3368L8.4449 0.608765ZM7.4141 1.12073C7.45288 1.05566 7.54712 1.05566 7.5859 1.12073L13.9798 11.8488C14.0196 11.9154 13.9715 12 13.8939 12H1.10608C1.02849 12 0.980454 11.9154 1.02018 11.8488L7.4141 1.12073ZM6.8269 4.48611C6.81221 4.10423 7.11783 3.78663 7.5 3.78663C7.88217 3.78663 8.18778 4.10423 8.1731 4.48612L8.01921 8.48701C8.00848 8.766 7.7792 8.98664 7.5 8.98664C7.2208 8.98664 6.99151 8.766 6.98078 8.48701L6.8269 4.48611ZM8.24989 10.476C8.24989 10.8902 7.9141 11.226 7.49989 11.226C7.08567 11.226 6.74989 10.8902 6.74989 10.476C6.74989 10.0618 7.08567 9.72599 7.49989 9.72599C7.9141 9.72599 8.24989 10.0618 8.24989 10.476Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>}
        <h5>{status === 'error' ? 'Error' : 'Upload in progress...'}</h5>
        <div>{message}</div>
      </div>
    </>
  )
}
