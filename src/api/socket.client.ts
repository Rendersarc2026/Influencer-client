import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_STORAGE_KEY = 'auth_token';

let socket: Socket | null = null;

/**
 * Manual reconnection after a rejected handshake.
 *
 * Socket.io retries a *transport* failure on its own, but a handshake the
 * server's auth middleware rejects is reported as unrecoverable: the client
 * emits `connect_error`, sets `active` to false and stops trying forever. The
 * stored token is rotated as the session slides forward, so a single attempt
 * made with a token that had just aged out killed realtime for the whole tab —
 * no messages, no presence, and a notification bell that stayed silent while
 * the conversation list kept updating over HTTP.
 *
 * Retrying on our own timer fixes that: the `auth` callback below is re-read on
 * every attempt, so the next one picks up whatever token the API has since
 * handed back.
 */
const AUTH_RETRY_INITIAL_MS = 2000;
const AUTH_RETRY_MAX_MS = 30000;
let authRetryTimer: ReturnType<typeof setTimeout> | null = null;
let authRetryDelay = AUTH_RETRY_INITIAL_MS;

function clearAuthRetry(): void {
  if (authRetryTimer) {
    clearTimeout(authRetryTimer);
    authRetryTimer = null;
  }
  authRetryDelay = AUTH_RETRY_INITIAL_MS;
}

function scheduleAuthRetry(): void {
  if (authRetryTimer) return;
  const delay = authRetryDelay;
  authRetryDelay = Math.min(authRetryDelay * 2, AUTH_RETRY_MAX_MS);
  authRetryTimer = setTimeout(() => {
    authRetryTimer = null;
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, delay);
}

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

    socket.on('connect', clearAuthRetry);
    socket.on('connect_error', () => {
      // `active` is false exactly when socket.io has given up on its own.
      if (socket && !socket.active) {
        scheduleAuthRetry();
      }
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

/**
 * Disconnects without discarding the instance.
 *
 * Nulling the singleton here meant the next `getSocket()` built a *second*
 * socket, so effect cleanups ran their `.off()` calls against an emitter that
 * had never carried their handlers: the listeners on the original stayed bound
 * and the chat screen ended up listening to a socket nobody would reconnect.
 * Keeping one instance for the lifetime of the page makes `off` symmetric with
 * `on`, and a later `connectSocket()` re-handshakes with a fresh token.
 */
export function disconnectSocket(): void {
  if (!socket) return;
  clearAuthRetry();
  socket.disconnect();
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
