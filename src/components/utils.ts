import { useEffect, useRef, useCallback } from 'react';

const MUX_VIDEO_DOMAIN = 'mux.com';

interface PosterProps {
  token?: string;
  thumbnailTime?: number;
  width?: number;
  domain?: string;
}

export const getPosterURLFromPlaybackId = (
  playbackId?: string,
  { token, thumbnailTime, width, domain = MUX_VIDEO_DOMAIN }: PosterProps = {}
) => {
  // NOTE: thumbnailTime is not supported when using a signedURL/token. Remove under these cases. (CJP)
  const time = token == null ? thumbnailTime : undefined;

  const { aud } = parseJwt(token);

  if (token && aud !== 't') {
    return;
  }

  return `https://image.${domain}/${playbackId}/thumbnail.webp${toQuery({
    token,
    time,
    width,
  })}`;
};

function toQuery(obj: Record<string, any>) {
  const params = toParams(obj).toString();
  return params ? '?' + params : '';
}

function toParams(obj: Record<string, any>) {
  const params: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] != null) params[key] = obj[key];
  }
  return new URLSearchParams(params);
}

function parseJwt(token: string | undefined) {
  const base64Url = (token ?? '').split('.')[1];

  // exit early on invalid value
  if (!base64Url) return {};

  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
  return JSON.parse(jsonPayload);
}

const DEFAULT_POLLING_INTERVAL = 5000;

// Note: doesn't get updated when the callback function changes
export function usePolling(
  callback: (abortSignal: AbortSignal) => any,
  interval: number | null = DEFAULT_POLLING_INTERVAL,
) {
  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    callback(abortControllerRef.current.signal);

    return () => {
      // Effects run twice in dev mode so this will run once.
      abortControllerRef.current.abort();
    }
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
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    let id: any;

    const tick = async () => {
      // Wait to kick off another async callback until the current one is finished.
      await savedCallback.current?.();

      if (delay != null) {
        id = setTimeout(tick, delay);
      }
    }

    if (delay != null) {
      id = setTimeout(tick, delay);
      return () => clearTimeout(id);
    }
  }, [delay]);
}
