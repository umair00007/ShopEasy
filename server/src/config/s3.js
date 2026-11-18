import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

// Credentials: if keys are in .env (local dev) we pass them explicitly.
// If they are NOT set (on EC2) we pass nothing, and the SDK automatically uses its
// "default credential provider chain": env vars → shared config file → EC2 IAM Role
// (via the instance metadata service). That is why no keys are needed in production.
export const s3 = new S3Client({
  region: env.AWS_REGION,
  ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? { credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY } }
    : {}),
});
