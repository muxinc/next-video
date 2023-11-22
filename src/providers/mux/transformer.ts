import type { Asset } from '../../assets.js';

type Props = {
  customDomain?: string;
  thumbnailTime?: number;
  startTime?: number;
  tokens?: { thumbnail?: string }
};

type PosterProps = {
  customDomain?: string;
  thumbnailTime?: number;
  token?: string;
  width?: number;
}

const MUX_VIDEO_DOMAIN = 'mux.com';

export function transform(asset: Asset, props?: Props) {
  const playbackId = getPlaybackId(asset);
  if (!playbackId) return asset;

  return {
    ...asset,

    sources: [
      { src: `https://stream.mux.com/${playbackId}.m3u8`, type: 'application/x-mpegURL' }
      // todo: add progressive downloads?
    ],

    poster: getPosterURLFromPlaybackId(playbackId, {
      customDomain: props?.customDomain,
      thumbnailTime: props?.thumbnailTime ?? props?.startTime,
      token: props?.tokens?.thumbnail,
    })
  }
}

export function getPlaybackId(asset: Asset): string | undefined {
  // Fallback to asset.externalIds for backwards compatibility with older assets.
  const providerDetails = asset.providerSpecific?.mux ?? asset.externalIds;
  return providerDetails?.playbackId;
}

export const getPosterURLFromPlaybackId = (
  playbackId?: string,
  { token, thumbnailTime, width, customDomain = MUX_VIDEO_DOMAIN }: PosterProps = {}
) => {
  // NOTE: thumbnailTime is not supported when using a signedURL/token. Remove under these cases. (CJP)
  const time = token == null ? thumbnailTime : undefined;
  const { aud } = parseJwt(token);

  if (token && aud !== 't') {
    return;
  }

  return `https://image.${customDomain}/${playbackId}/thumbnail.webp${toQuery({
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
