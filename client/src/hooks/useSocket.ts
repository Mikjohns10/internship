import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addNotification, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    // Only create one socket connection
    if (!socket) {
      socket = io(SOCKET_URL, {
        auth: { token: accessToken },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      socket.on('connect', () => {
        console.log('🔌 Socket connected');
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      // Real-time notification handler
      socket.on('notification:new', (notification) => {
        addNotification(notification);
      });

      // Notification count update
      socket.on('notification:count', (data: { count: number }) => {
        setUnreadCount(data.count);
      });
    }

    socketRef.current = socket;

    return () => {
      // Don't disconnect on cleanup — keep the socket alive
      // Only disconnect when user logs out
    };
  }, [isAuthenticated, accessToken, addNotification, setUnreadCount]);

  const joinProject = useCallback((projectId: string) => {
    socket?.emit('project:join', projectId);
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    socket?.emit('project:leave', projectId);
  }, []);

  const disconnect = useCallback(() => {
    socket?.disconnect();
    socket = null;
  }, []);

  return {
    socket: socketRef.current,
    joinProject,
    leaveProject,
    disconnect,
  };
}

export function getSocket(): Socket | null {
  return socket;
}
