function generateRandomString() {
  return Math.random().toString(36).substring(2, 15);
}

export const get = (url: string, options: any = {}) => {
  const [_, _video, _v1, objectType, id] = url.split('/');

  if (objectType === 'uploads') {
    return {
      data: {
        id: id,
        asset_id: `fake-asset-id-${generateRandomString()}`,
      },
    };
  }

  if (objectType === 'assets') {
    return {
      data: {
        id: id,
        status: 'ready',
        playback_ids: [{ id: '4dcO6muLn7wz9pPTNrTboJxb74Z9XyWK' }],
      },
    };
  }
};

export const post = (url: string, options: any = {}) => {
  const [_, _video, _v1, objectType] = url.split('/');

  const fakeId = generateRandomString();

  if (objectType === 'uploads') {
    return {
      data: {
        id: `fake-upload-${fakeId}`,
        url: `http://localhost:3123/fake-upload-url-${fakeId}`,
      },
    };
  }
};
