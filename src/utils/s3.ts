/* c8 ignore start */
import {
  S3Client,
  PutBucketCorsCommand,
  CreateBucketCommand,
  PutObjectCommand,
  ListBucketsCommand,
  DeletePublicAccessBlockCommand,
  PutBucketAclCommand,
} from '@aws-sdk/client-s3';

export async function findBucket(s3: S3Client, callbackFn: (bucket: { Name?: string }) => boolean | void) {
  const { Buckets } = await s3.send(new ListBucketsCommand({}));
  return Buckets?.find(callbackFn);
}

export function createBucket(s3: S3Client, bucketName: string, input?: Partial<CreateBucketCommand['input']>) {
  return s3.send(new CreateBucketCommand({
    Bucket: bucketName,
    ...input
  }));
}

export async function putBucketAcl(s3: S3Client, bucketName: string, input?: Partial<PutBucketAclCommand['input']>) {
  // Remove the public access block that is created by default.
  // https://aws.amazon.com/blogs/aws/heads-up-amazon-s3-security-changes-are-coming-in-april-of-2023/
  await s3.send(new DeletePublicAccessBlockCommand({
    Bucket: bucketName
  }));

  return s3.send(new PutBucketAclCommand({
    Bucket: bucketName,
    ACL: input?.ACL ?? 'public-read',
    ...input,
  }));
}

export function putObject(s3: S3Client, input: PutObjectCommand['input']) {
  return s3.send(new PutObjectCommand(input));
}

export function putBucketCors(s3: S3Client, bucketName: string) {
  return s3.send(new PutBucketCorsCommand({
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          // Allow all headers to be sent to this bucket.
          AllowedHeaders: ['*'],
          // Allow only GET and PUT methods to be sent to this bucket.
          AllowedMethods: ['GET', 'PUT'],
          // Allow only requests from the specified origin.
          AllowedOrigins: ['*'],
          // Allow the entity tag (ETag) header to be returned in the response. The ETag header
          // The entity tag represents a specific version of the object. The ETag reflects
          // changes only to the contents of an object, not its metadata.
          ExposeHeaders: ['ETag'],
          // How long the requesting browser should cache the preflight response. After
          // this time, the preflight request will have to be made again.
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }));
}
/* c8 ignore stop */
