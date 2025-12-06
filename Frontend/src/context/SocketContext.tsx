import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  priority: string;
  createdAt: Date;
  metadata?: {
    icon?: string;
    [key: string]: any;
  };
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  notifications: [],
  unreadCount: 0,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = apiUrl.replace('/api', '').replace(':5000/api', ':5000');

    const newSocket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Connected:', data);
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      if (Notification.permission === 'granted') {
        try {
          new Notification(notification.title, {
            body: notification.message,
            icon: notification.metadata?.icon || '/favicon.ico',
          });
        } catch (error) {
          console.error('Error showing browser notification:', error);
        }
      }
    });

    newSocket.on('notification:read', () => {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    newSocket.on('notifications:all-read', () => {
      setUnreadCount(0);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, notifications, unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};
