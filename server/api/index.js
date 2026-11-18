// Vercel serverless entry point. Locally (and on EC2) src/server.js is used instead.
// WHY: Vercel doesn't run app.listen(); it calls this handler per request. We connect to
// MongoDB once per warm instance and reuse that connection on later requests.
import '../src/config/env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import app from '../src/app.js';

let connecting;

export default async function handler(req, res) {
  if (mongoose.connection.readyState !== 1) {
    connecting ??= connectDB().catch((err) => {
      connecting = undefined; // allow a retry on the next request
      throw err;
    });
    await connecting;
  }
  return app(req, res);
}
