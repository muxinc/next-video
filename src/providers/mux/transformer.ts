import type { Asset } from '../../assets.js';

type Props = {
  customDomain?: string;
  thumbnailTime?: number;
  startTime?: number;
  tokens?: { thumbnail?: string };
};

type PosterProps = {
  customDomain?: string;
  thumbnailTime?: number;
  token?: string;
  width?: number | string;
};

const MUX_VIDEO_DOMAIN = 'mux.com';

export function transform(asset: Asset, props?: Props) {
  const playbackId = getPlaybackId(asset);
  if (!playbackId) return asset;

  const thumbnailTime =
    asset.providerMetadata?.mux?.thumbnailTime ?? props?.thumbnailTime ?? props?.startTime;

  const transformedAsset: Asset = {
    ...asset,

    sources: [{
      src: `https://stream.${props?.customDomain ?? MUX_VIDEO_DOMAIN}/${playbackId}.m3u8`,
      type: 'application/x-mpegURL'
    }],

    poster: getPosterURLFromPlaybackId(playbackId, {
      thumbnailTime,
      customDomain: props?.customDomain,
      token: props?.tokens?.thumbnail,
    }),
  };

  if (thumbnailTime >= 0) {
    transformedAsset.thumbnailTime = thumbnailTime;
  }

  return transformedAsset;
}

export function getPlaybackId(asset: Asset): string | undefined {
  // Fallback to asset.externalIds for backwards compatibility with older assets.
  const providerMetadata = asset.providerMetadata?.mux ?? asset.externalIds;
  return providerMetadata?.playbackId;
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
