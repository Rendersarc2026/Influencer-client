import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_STORAGE_KEY = 'auth_token';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 10000,
      auth: (cb) => {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
        cb({ token });
      },
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinChat(chatId: string): void {
  const s = getSocket();
  if (chatId) {
    s.emit('join_chat', chatId);
  }
}

export function leaveChat(chatId: string): void {
  const s = getSocket();
  if (chatId) {
    s.emit('leave_chat', chatId);
  }
}

export function sendTyping(chatId: string): void {
  const s = getSocket();
  if (chatId) {
    s.emit('typing', { chatId });
  }
}

export function sendStopTyping(chatId: string): void {
  const s = getSocket();
  if (chatId) {
    s.emit('stop_typing', { chatId });
  }
}

/**
 * Presence.
 *
 * The server announces only transitions (`presence:online` / `presence:offline`)
 * and answers `presence:request` with the full set. A listener that arrives
 * after those transitions have already happened would otherwise show everyone
 * as offline, so callers ask for a snapshot once they are subscribed.
 */
export interface PresenceHandlers {
  onSnapshot: (userIds: string[]) => void;
  onOnline: (userId: string) => void;
  onOffline: (userId: string) => void;
}

export function subscribeToPresence(handlers: PresenceHandlers): () => void {
  const s = getSocket();

  const handleSnapshot = (data: { userIds?: string[] }) => handlers.onSnapshot(data?.userIds ?? []);
  const handleOnline = (data: { userId?: string }) => {
    if (data?.userId) handlers.onOnline(data.userId);
  };
  const handleOffline = (data: { userId?: string }) => {
    if (data?.userId) handlers.onOffline(data.userId);
  };

  s.on('presence:snapshot', handleSnapshot);
  s.on('presence:online', handleOnline);
  s.on('presence:offline', handleOffline);
  // A reconnect replays no history, so re-ask whenever the socket comes back.
  s.on('connect', requestPresence);

  requestPresence();

  return () => {
    s.off('presence:snapshot', handleSnapshot);
    s.off('presence:online', handleOnline);
    s.off('presence:offline', handleOffline);
    s.off('connect', requestPresence);
  };
}

function requestPresence(): void {
  const s = getSocket();
  if (s.connected) {
    s.emit('presence:request');
  }
}
