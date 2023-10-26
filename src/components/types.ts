import type { VideoConfig } from '../config.js';
import type { FunctionComponent } from 'react';
import type { DefaultPlayerProps } from './default-player.js';
import type { Asset } from '../assets.js';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: any;
  }
}

export type VideoLoader = (p: VideoLoaderProps) => Promise<string>;
export type VideoLoaderWithConfig = (p: VideoLoaderPropsWithConfig) => Promise<string>;

export interface VideoLoaderProps {
  src?: string;
  width?: number;
  height?: number;
}

export type VideoLoaderPropsWithConfig = VideoLoaderProps & {
  config: Readonly<VideoConfig>
}

export interface PosterProps {
  token?: string;
  thumbnailTime?: number;
  width?: number;
  domain?: string;
}

export interface VideoProps extends Omit<DefaultPlayerProps, 'src'> {
  /**
   * The component type to render the video as.
   */
  as?: FunctionComponent<DefaultPlayerProps>;

  /**
   * An imported video source object or a string video source URL.
   * Can be a local or remote video file.
   * If it's a string be sure to create an API endpoint to handle the request.
   */
  src?: Asset | string;

  /**
   * Give a fixed width to the video.
   */
  width?: number;

  /**
   * Give a fixed height to the video.
   */
  height?: number;

  /**
   * Set to false to hide the video controls.
   */
  controls?: boolean;

  /**
   * Set a manual data URL to be used as a placeholder image before the poster image successfully loads.
   * For imported videos this will be automatically generated.
   */
  blurDataURL?: string;

  /**
   * For best image loading performance the user should provide the sizes attribute.
   * The width of the image in the webpage. e.g. sizes="800px". Defaults to 100vw.
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#sizes
   */
  sizes?: string;

  /**
   * A custom function used to resolve video URLs.
   */
  loader?: VideoLoader;
}

export interface PlayerProps {
  /**
   * The asset object for the video.
   */
  asset?: Asset;

  /**
   * A string video source URL.
   */
  src?: string | undefined;

  /**
   * Set to false to hide the video controls.
   */
  controls?: boolean;

  /**
   * Set a manual data URL to be used as a placeholder image before the poster image successfully loads.
   * For imported videos this will be automatically generated.
   */
  blurDataURL?: string;
}
