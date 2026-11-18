import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isProd } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// app.js builds the Express app; server.js starts it.
// WHY split them: tests can import `app` without opening a port or a DB connection.
const app = express();

// Behind Nginx on EC2 the real client IP arrives in X-Forwarded-For; this tells Express to trust it.
app.set('trust proxy', 1);

app.use(helmet()); // sets secure HTTP headers (XSS, clickjacking, MIME sniffing protections)
app.use(cors({ origin: env.CLIENT_URL, credentials: true })); // only our frontend may call the API from a browser
app.use(express.json({ limit: '1mb' })); // parse JSON bodies, reject huge ones
app.use(morgan(isProd ? 'combined' : 'dev')); // request logging

app.use('/api', apiRoutes);

app.use(notFound); // must come after all routes
app.use(errorHandler); // must be LAST

export default app;
