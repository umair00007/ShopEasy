// Usage: npm run make-admin -- someone@example.com
// Admins can't be created through the public API (that would be a security hole),
// so we promote an existing user directly in the database.
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

await mongoose.connect(env.MONGO_URI);
const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { returnDocument: 'after' });
console.log(user ? `✅ ${user.email} is now an admin` : `❌ No user with email ${email}. Register first.`);
await mongoose.disconnect();
