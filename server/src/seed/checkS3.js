// Usage: npm run check-s3
// Proves the S3 setup works end to end: upload → read through a pre-signed URL → delete.
import { env } from '../config/env.js';
import { uploadImage, getImageUrl, deleteImage } from '../utils/s3.js';

const fail = (msg, err) => {
  console.error(`❌ ${msg}`);
  if (err) console.error(`   ${err.name}: ${err.message}`);
  process.exit(1);
};

if (!env.AWS_S3_BUCKET) fail('AWS_S3_BUCKET is empty in server/.env');
console.log(`Bucket: ${env.AWS_S3_BUCKET}  Region: ${env.AWS_REGION}  Keys in .env: ${env.AWS_ACCESS_KEY_ID ? 'yes' : 'no (using IAM role)'}`);

// A tiny valid 1x1 PNG.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

let key;
try {
  key = await uploadImage({ buffer: png, mimetype: 'image/png', originalname: 'test.png' });
  console.log(`✅ Upload OK     → ${key}`);
} catch (e) {
  fail('Upload failed (check bucket name, region, keys and that the policy allows s3:PutObject on /products/*)', e);
}

try {
  const url = await getImageUrl(key);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  console.log('✅ Read OK       → pre-signed URL works');
} catch (e) {
  fail('Pre-signed read failed (policy needs s3:GetObject)', e);
}

try {
  await deleteImage(key);
  console.log('✅ Delete OK     → test file removed');
} catch (e) {
  fail('Delete failed (policy needs s3:DeleteObject)', e);
}

try {
  const url = await getImageUrl(key);
  const res = await fetch(url);
  console.log(res.status === 404 || res.status === 403 ? '✅ Private bucket confirmed: deleted object no longer served' : `⚠️  Unexpected status ${res.status} after delete`);
} catch { /* ignore */ }

console.log('\n🎉 S3 is ready. You can upload product photos in /admin.');
