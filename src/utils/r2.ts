import { request } from 'undici';

interface CloudflareR2PolicyResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: {
    publicId: string;
    onlyViaCnames: string[];
  };
}

export async function publicAccessR2Bucket(
  accountId: string,
  bucketName: string,
  apiToken: string
): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/policy?access=PublicUrlAndCnames`;

  try {
    const { statusCode, body } = await request(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseBody: CloudflareR2PolicyResponse = (await body.json()) as CloudflareR2PolicyResponse;

    if (statusCode !== 200 || !responseBody.success) {
      throw new Error(
        `Failed to set public access. Status code: ${statusCode}, Error details: ${JSON.stringify(responseBody.errors)}`
      );
    }

    if (responseBody.result.onlyViaCnames.length > 0) {
      return responseBody.result.onlyViaCnames[0];
    } else {
      return `${responseBody.result.publicId}.r2.dev`;
    }
  } catch (error) {
    throw new Error(`Error setting public access: ${(error as Error).message}`);
  }
}
