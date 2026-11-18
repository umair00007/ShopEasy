import crypto from 'crypto';
import path from 'path';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../config/s3.js';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const URL_TTL_SECONDS = 60 * 60; // pre-signed links work for 1 hour

const isExternal = (key) => /^https?:\/\//.test(key); // seed data uses plain URLs

function requireBucket() {
  if (!env.AWS_S3_BUCKET) throw new ApiError(500, 'S3 is not configured (AWS_S3_BUCKET missing in server/.env)');
}

// Uploads one multer file. The unique name stops two files with the same name overwriting each other,
// and we never trust the user's original filename (it could contain "../" tricks).
export async function uploadImage(file) {
  requireBucket();
  const key = `products/${crypto.randomUUID()}${EXT[file.mimetype] || path.extname(file.originalname)}`;
  await s3.send(
    new PutObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype })
  );
  return key;
}

export async function deleteImage(key) {
  if (!key || isExternal(key)) return;
  requireBucket();
  await s3.send(new DeleteObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }));
}

// The bucket is PRIVATE. A pre-signed URL is a normal URL with a signature and an expiry baked in,
// created with OUR credentials, so the browser can read this one object for a limited time.
export async function getImageUrl(key) {
  if (isExternal(key)) return key;
  if (!env.AWS_S3_BUCKET) return null;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: env.AWS_S3_BUCKET, Key: key }), { expiresIn: URL_TTL_SECONDS });
}
