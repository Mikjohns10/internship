import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { initializeSocket } from './socket';
import { startOverdueChecker } from './jobs/overdueChecker';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import clientRoutes from './routes/client.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize WebSocket
initializeSocket(server);

// Start background jobs
startOverdueChecker();

// Start server
server.listen(env.PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${env.PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🔄 Overdue checker running every 5 minutes\n`);
});

export default app;
