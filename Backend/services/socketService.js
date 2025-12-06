const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;
const userSockets = new Map();
const adminSockets = new Set();
const retailerSockets = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth.token;
      
      if (!token) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);

    if (socket.userRole === 'admin') {
      adminSockets.add(socket.id);
      socket.join('admins');
    } else if (socket.userRole === 'retailer') {
      if (!retailerSockets.has(socket.userId)) {
        retailerSockets.set(socket.userId, new Set());
      }
      retailerSockets.get(socket.userId).add(socket.id);
      socket.join('retailers');
    }

    socket.join(`user:${socket.userId}`);

    socket.emit('connected', {
      message: 'Connected to real-time server',
      userId: socket.userId,
      role: socket.userRole,
      timestamp: new Date(),
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      
      if (userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId);
        }
      }

      if (socket.userRole === 'admin') {
        adminSockets.delete(socket.id);
      }

      if (socket.userRole === 'retailer' && retailerSockets.has(socket.userId)) {
        retailerSockets.get(socket.userId).delete(socket.id);
        if (retailerSockets.get(socket.userId).size === 0) {
          retailerSockets.delete(socket.userId);
        }
      }
    });
  });

  console.log('🔌 Socket.IO server initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const emitToUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, { ...data, timestamp: new Date() });
};

const emitToAdmins = (event, data) => {
  if (!io) return;
  io.to('admins').emit(event, { ...data, timestamp: new Date() });
};

const emitToRetailers = (event, data) => {
  if (!io) return;
  io.to('retailers').emit(event, { ...data, timestamp: new Date() });
};

const emitToAll = (event, data) => {
  if (!io) return;
  io.emit(event, { ...data, timestamp: new Date() });
};

const isUserOnline = (userId) => {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
};

const getOnlineStats = () => {
  return {
    totalUsers: userSockets.size,
    totalAdmins: adminSockets.size,
    totalRetailers: retailerSockets.size,
    totalConnections: io ? io.sockets.sockets.size : 0,
  };
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToAdmins,
  emitToRetailers,
  emitToAll,
  isUserOnline,
  getOnlineStats,
};
