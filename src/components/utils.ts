import { useEffect, useRef, useCallback } from 'react';

export const config = JSON.parse(
  process.env.NEXT_PUBLIC_DEV_VIDEO_OPTS ??
    process.env.NEXT_PUBLIC_VIDEO_OPTS ??
    '{}'
);

const DEFAULT_POLLING_INTERVAL = 5000;
const FILES_FOLDER = `${config.folder ?? 'videos'}/`;

export function toSymlinkPath(path?: string) {
  if (!path?.startsWith(FILES_FOLDER)) return path;
  return path?.replace(FILES_FOLDER, `_next-video/`);
}

export function camelCase(name: string) {
  return name.replace(/[-_]([a-z])/g, ($0, $1) => $1.toUpperCase());
}

export function getUrlExtension(url: string | unknown) {
  if (typeof url === 'string') {
    return url.split(/[#?]/)[0].split('.').pop()?.trim();
  }
}

// Note: doesn't get updated when the callback function changes
export function usePolling(
  callback: (abortSignal: AbortSignal) => any,
  interval: number | null = DEFAULT_POLLING_INTERVAL
) {
  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    callback(abortControllerRef.current.signal);

    return () => {
      // Effects run twice in dev mode so this will run once.
      abortControllerRef.current.abort();
    };
  }, []);

  const intervalFn = useCallback(() => {
    return callback(abortControllerRef.current.signal);
  }, []);

  useInterval(intervalFn, interval);
}

export function useInterval(callback: () => any, delay: number | null) {
  const savedCallback = useRef<() => any | undefined>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Set up the interval.
  useEffect(() => {
    const tick = async () => {
      await savedCallback.current?.();
    };

    if (delay != null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export function isReactComponent<TProps>(
  component: unknown
): component is React.ComponentType<TProps> {
  return (
    isClassComponent(component) ||
    typeof component === 'function' ||
    isExoticComponent(component)
  );
}

function isClassComponent(component: any) {
  return (
    typeof component === 'function' &&
    (() => {
      const proto = Object.getPrototypeOf(component);
      return proto.prototype && proto.prototype.isReactComponent;
    })()
  );
}

function isExoticComponent(component: any) {
  return (
    typeof component === 'object' &&
    typeof component.$$typeof === 'symbol' &&
    ['react.memo', 'react.forward_ref'].includes(component.$$typeof.description)
  );
}

export function svgBlurImage(blurDataURL: string) {
  const svg = /*html*/`<svg xmlns="http://www.w3.org/2000/svg"><filter id="b" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="20"/><feComponentTransfer><feFuncA type="discrete" tableValues="1 1"/></feComponentTransfer></filter><g filter="url(#b)"><image width="100%" height="100%" preserveAspectRatio="xMidYMid slice" href="${blurDataURL}"/></g></svg>`;
  return svg.replace(/#/g, '%23');
}
