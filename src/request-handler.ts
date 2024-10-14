import type { NextApiRequest, NextApiResponse } from 'next';
import { callHandler } from './process.js';
import { createAsset, getAsset } from './assets.js';
import { getVideoConfig } from './config.js';

// App Router
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url');
  const { status, data } = await getRequest(url);
  // @ts-ignore - Response.json() is only valid from TypeScript 5.2
  return Response.json(data, { status });
}

// App Router
export async function POST(request: Request) {
  const { url } = await request.json();
  const { status, data } = await postRequest(url);
  // @ts-ignore - Response.json() is only valid from TypeScript 5.2
  return Response.json(data, { status });
}

// Pages Router
export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  if (req.method === 'POST') {
    const { status, data } = await postRequest(String(req.body.url));
    res.status(status).json(data);
    return;
  }

  const { status, data } = await getRequest(String(req.query.url));
  res.status(status).json(data);
}

async function getRequest(url?: string | null) {
  if (!url) {
    return {
      status: 400,
      data: { error: 'url parameter is required' }
    };
  }

  let asset;
  try {
    asset = await getAsset(url);
  } catch {

    // In dev mode we try to create the asset if it doesn't exist on a GET request.
    const isDevMode = process.env.NODE_ENV === 'development';

    if (isDevMode) {
      asset = await createAsset(url);

      if (asset) {
        const videoConfig = await getVideoConfig();
        await callHandler('request.video.added', asset, videoConfig);

        return { status: 200, data: asset };
      } else {
        return { status: 500, data: { error: 'could not create asset' } };
      }
    }

    return { status: 404, data: { error: 'asset not found' } };
  }

  return { status: 200, data: asset };
}

async function postRequest(url?: string | null) {
  if (!url) {
    return {
      status: 400,
      data: { error: 'url parameter is required' }
    };
  }

  let asset;
  try {
    asset = await createAsset(url);

    if (!asset) {
      return { status: 500, data: { error: 'could not create asset' } };
    }

    const videoConfig = await getVideoConfig();
    await callHandler('request.video.added', asset, videoConfig);

    return { status: 200, data: asset };
  } catch {
    return { status: 500, data: { error: 'could not create asset' } };
  }
}
