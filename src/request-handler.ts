import type { NextApiRequest, NextApiResponse } from 'next';

import { callHandler } from './main.js';
import { createAsset, getAsset } from './assets.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

  const url = String(req.query.url);
  if (!url) {
    res.status(400).json({ error: 'url parameter is required' });
    return;
  }

  const remoteRegex = /^https?:\/\//;
  const isRemote = remoteRegex.test(url);

  if (!isRemote) {
    // todo: handle local files via string src
    res.status(400).json({ error: 'local files should be imported as a module' });
    return;
  }

  let asset;
  try {
    asset = await getAsset(url);
  } catch {
    // todo: does this require auth?
    asset = await createAsset(url);
    await callHandler('request.video.added', asset);

    res.status(200).json(asset);
    return;
  }

  res.status(200).json(asset);
}
