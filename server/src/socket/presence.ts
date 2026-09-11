/**
 * Presence Manager
 * Tracks which users are currently online.
 * Uses a Map of userId -> Set of socketIds (handles multiple tabs/devices).
 */
class PresenceManager {
  private onlineUsers: Map<string, Set<string>> = new Map();

  addUser(userId: string, socketId: string) {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
  }

  removeUser(userId: string, socketId: string) {
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      // Only fully remove user when all their tabs/windows are closed
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
      }
    }
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineCount(): number {
    return this.onlineUsers.size;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.onlineUsers.keys());
  }
}

export const presenceManager = new PresenceManager();
