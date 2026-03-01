import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Use the env var if set, otherwise derive from the current page's origin
// so it works on any deployed domain without hardcoding localhost
const WS_URL =
  process.env.REACT_APP_WS_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribe = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const unsubscribe = (event: string) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  };

  const emit = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    connected,
    subscribe,
    unsubscribe,
    emit,
  };
};
