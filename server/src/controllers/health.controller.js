import mongoose from 'mongoose';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// GET /api/health — used by us (and later by monitoring / load balancers)
// to check that the API is up and connected to the database.
// Returns 503 (Service Unavailable) if the DB is not connected.
export function getHealth(_req, res) {
  const db = DB_STATES[mongoose.connection.readyState] || 'unknown';
  const healthy = db === 'connected';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'ok' : 'degraded',
    db,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
