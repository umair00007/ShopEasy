// Usage: npm run upload-images
// Uploads ../product-images/<product-name-slug>.png to S3 and links it to the matching product.
// Products that already have images are skipped, so it is safe to re-run.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Product from '../models/Product.js';
import { uploadImage } from '../utils/s3.js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../product-images');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

if (!env.AWS_S3_BUCKET) { console.error('❌ AWS_S3_BUCKET is empty in server/.env'); process.exit(1); }

await mongoose.connect(env.MONGO_URI);
const products = await Product.find();
let done = 0, skipped = 0, missing = 0;

for (const p of products) {
  if (p.images?.length) { skipped++; continue; }
  const file = path.join(DIR, `${slug(p.name)}.png`);
  if (!fs.existsSync(file)) { console.log(`⚠️  No image file for "${p.name}"`); missing++; continue; }
  const key = await uploadImage({ buffer: fs.readFileSync(file), mimetype: 'image/png', originalname: path.basename(file) });
  p.images = [key];
  await p.save();
  console.log(`✅ ${p.name} → ${key}`);
  done++;
}

console.log(`\nUploaded ${done}, skipped ${skipped} (already had images), no file for ${missing}.`);
await mongoose.disconnect();
