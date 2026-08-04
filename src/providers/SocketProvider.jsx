import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_PATH } from '../lib/constants.js';
import { useAuth } from './AuthProvider.jsx';

const SocketContext = createContext({ socket: null, connected: false });

export function SocketProvider({ children }) {
  const { auth } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!auth?.token) {
      setSocket(null);
      setConnected(false);
      return undefined;
    }

    const instance = io(API_URL.origin, {
      path: SOCKET_PATH,
      auth: { token: auth.token },
      transports: ['websocket'],
      upgrade: false,
      withCredentials: true,
    });
    instance.on('connect', () => setConnected(true));
    instance.on('disconnect', () => setConnected(false));
    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [auth?.token]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
