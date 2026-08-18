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
      auth: (cb) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
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
