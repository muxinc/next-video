import { useEffect, useRef, useCallback } from 'react';

export const config = JSON.parse(
  process.env.NEXT_PUBLIC_DEV_VIDEO_OPTS ??
    process.env.NEXT_PUBLIC_VIDEO_OPTS ??
    '{}'
);

const MUX_VIDEO_DOMAIN = 'mux.com';
const DEFAULT_POLLING_INTERVAL = 5000;
const FILES_FOLDER = `${config.folder ?? 'videos'}/`;

export function toSymlinkPath(path?: string) {
  if (!path?.startsWith(FILES_FOLDER)) return path;
  return path?.replace(FILES_FOLDER, `_next-video/`);
}

export function camelCase(name: string) {
  return name.replace(/[-_]([a-z])/g, ($0, $1) => $1.toUpperCase());
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
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    let id: any;

    const tick = async () => {
      // Wait to kick off another async callback until the current one is finished.
      await savedCallback.current?.();

      if (delay != null) {
        id = setTimeout(tick, delay);
      }
    };

    if (delay != null) {
      id = setTimeout(tick, delay);
      return () => clearTimeout(id);
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
