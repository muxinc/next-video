import type { VideoConfig } from '../config.js';
import type { Asset } from '../assets.js';
import { StaticImageData } from 'next/image.js';
import type { MediaProps, NativeVideoProps, MuxVideoProps } from './players/media/index.js';

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

type DefaultPlayerProps = Omit<MediaProps, 'ref'> & PlayerProps;

// Keep in mind the hierarchy is Video(Player(Media))

export type VideoProps<TPlaybackId = string | undefined> = TPlaybackId extends string
  ? Omit<Partial<MuxVideoProps> & PlayerProps, 'src' | 'poster'> & SuperVideoProps & { playbackId?: TPlaybackId }
  : Omit<NativeVideoProps & PlayerProps, 'src' | 'poster'> & SuperVideoProps & { playbackId?: undefined };

type SuperVideoProps = {
  /**
   * The component type to render the video as.
   */
  as?: React.FunctionComponent<DefaultPlayerProps>;

  /**
   * An imported video source object or a string video source URL.
   * Can be a local or remote video file.
   * If it's a string be sure to create an API endpoint to handle the request.
   */
  src?: Asset | string;

  /**
   * The poster image for the video.
   */
  poster?: StaticImageData | string;

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
   * A custom function used to resolve string based video URLs (not imports).
   */
  loader?: VideoLoader;

  /**
   * A custom function to transform the asset object (src and poster).
   */
  transform?: (asset: Asset) => Asset;
}

export type VideoPropsInternal = VideoProps & {
  /**
   * The component type to render the video as.
   */
  as: React.FunctionComponent<DefaultPlayerProps>;

  /**
   * A custom function used to resolve string based video URLs (not imports).
   */
  loader: VideoLoader;

  /**
   * A custom function to transform the asset object (src and poster).
   */
  transform: (asset: Asset, props?: Record<string, any>) => Asset;
}

export type PlayerProps = {
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
   * The poster image for the video.
   */
  poster?: StaticImageData | string;

  /**
   * Set a manual data URL to be used as a placeholder image before the poster image successfully loads.
   * For imported videos this will be automatically generated.
   */
  blurDataURL?: string;

  /**
   * The thumbnail time in seconds to use for the video poster image.
   */
  thumbnailTime?: number;

  /**
   * Change the look and feel with a custom theme.
   */
  theme?: React.ComponentType;
}
