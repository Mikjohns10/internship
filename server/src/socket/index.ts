import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../middleware/auth';
import { presenceManager } from './presence';
import { activityLogService } from '../services/activityLog.service';
import prisma from '../config/db';

let io: Server;

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    console.log(`User connected: ${user.name} (${user.role})`);

    // Track presence
    presenceManager.addUser(user.userId, socket.id);

    // Join user-specific room (for notifications)
    socket.join(`user:${user.userId}`);

    // Join project rooms based on role
    await joinProjectRooms(socket, user);

    // Admin joins the global feed room
    if (user.role === 'ADMIN') {
      socket.join('global-feed');
    }

    // Broadcast updated online count
    io.emit('presence:update', {
      onlineCount: presenceManager.getOnlineCount(),
      onlineUsers: presenceManager.getOnlineUserIds(),
    });

    // Send missed activity events on connect (last 20 based on role)
    await sendMissedEvents(socket, user);

    // Handle joining a specific project room (when user navigates to project page)
    socket.on('project:join', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    // Handle leaving a project room
    socket.on('project:leave', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.name}`);
      presenceManager.removeUser(user.userId, socket.id);

      io.emit('presence:update', {
        onlineCount: presenceManager.getOnlineCount(),
        onlineUsers: presenceManager.getOnlineUserIds(),
      });
    });
  });

  return io;
}

/**
 * Auto-join socket to project rooms based on user role.
 */
async function joinProjectRooms(socket: Socket, user: JwtPayload) {
  try {
    if (user.role === 'ADMIN') {
      // Admin joins all project rooms
      const projects = await prisma.project.findMany({
        select: { id: true },
      });
      projects.forEach((p) => socket.join(`project:${p.id}`));
    } else if (user.role === 'PROJECT_MANAGER') {
      // PM joins only their own project rooms
      const projects = await prisma.project.findMany({
        where: { createdById: user.userId },
        select: { id: true },
      });
      projects.forEach((p) => socket.join(`project:${p.id}`));
    } else if (user.role === 'DEVELOPER') {
      // Developer joins rooms for projects they have tasks in
      const tasks = await prisma.task.findMany({
        where: { assignedToId: user.userId },
        select: { projectId: true },
        distinct: ['projectId'],
      });
      tasks.forEach((t) => socket.join(`project:${t.projectId}`));
    }
  } catch (err) {
    console.error('Error joining project rooms:', err);
  }
}

/**
 * Send the last 20 missed activity events when a user reconnects.
 * Events are filtered by role — just like the REST feed endpoint.
 */
async function sendMissedEvents(socket: Socket, user: JwtPayload) {
  try {
    let events;

    if (user.role === 'ADMIN') {
      events = await activityLogService.getGlobalFeed(20);
    } else if (user.role === 'PROJECT_MANAGER') {
      events = await activityLogService.getFeedForPM(user.userId, 20);
    } else {
      events = await activityLogService.getFeedForDeveloper(user.userId, 20);
    }

    socket.emit('activity:catchup', events);
  } catch (err) {
    console.error('Error sending missed events:', err);
  }
}
