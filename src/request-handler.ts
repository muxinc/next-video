import type { NextApiRequest, NextApiResponse } from 'next';
import { callHandler } from './process.js';
import { createAsset, getAsset } from './assets.js';
import { getVideoConfig } from './config.js';

// App Router
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url');
  const { status, data } = await handleRequest(url);
  // @ts-ignore - Response.json() is only valid from TypeScript 5.2
  return Response.json(data, { status });
}

// Pages Router
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { status, data } = await handleRequest(String(req.query.url));
  res.status(status).json(data);
}

async function handleRequest(url?: string | null) {
  if (!url) {
    return {
      status: 400,
      data: { error: 'url parameter is required' }
    };
  }

  const remoteRegex = /^https?:\/\//;
  const isRemote = remoteRegex.test(url);

  if (!isRemote) {
    // todo: handle local files via string src
    return {
      status: 400,
      data: { error: 'local files should be imported as a module' }
    };
  }

  let asset;
  try {
    asset = await getAsset(url);
  } catch {
    // todo: does this require auth?
    asset = await createAsset(url);

    if (asset) {
      const videoConfig = await getVideoConfig();
      await callHandler('request.video.added', asset, videoConfig);
    }

    return { status: 200, data: asset };
  }

  return { status: 200, data: asset };
}
