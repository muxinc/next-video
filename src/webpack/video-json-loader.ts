import { fetch as uFetch } from 'undici';

export default async function loader(this: any, source: string) {
  const params = new URLSearchParams(this.resourceQuery);
  const thumbnailTime = params.get('thumbnailTime');

  let asset;
  try {
    asset = JSON.parse(source);

    if (asset.poster && asset.provider === 'mux' && thumbnailTime && parseInt(thumbnailTime) >= 0) {
      // This is added during build time, not stored in the JSON asset.
      asset.providerMetadata.mux.thumbnailTime = thumbnailTime;

      const poster = new URL(asset.poster);

      poster.searchParams.set('time', thumbnailTime);
      asset.poster = `${poster}`;

      poster.searchParams.set('width', '16');
      poster.searchParams.set('height', '16');
      asset.blurDataURL = await createThumbHash(`${poster}`);
    }
  } catch {
    asset = { status: 'error', message: 'Invalid JSON' };
  }

  return `${JSON.stringify(asset)}`;
}

export async function createThumbHash(imgUrl: string) {
  const response = await uFetch(imgUrl);
  const buffer = await response.arrayBuffer();
  const base64String = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return `data:image/webp;base64,${base64String}`;
}
