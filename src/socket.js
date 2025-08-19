import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import {io} from 'socket.io-client';

let socket = null;
let initialized = false;
let connecting = false;

export const connectSocket = async (passedToken = null) => {
  if (initialized && socket?.connected) {
    return socket;
  }

  if (connecting) {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (initialized && socket?.connected) {
          clearInterval(interval);
          resolve(socket);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Timeout while waiting for socket to connect'));
      }, 7000);
    });
  }

  connecting = true;

  let token = passedToken;
  if (!token) {
    token = await AsyncStorage.getItem('token');
    if (!token) {
      connecting = false;
      console.warn('⚠️ No token found. Skipping socket connection.');
      return null;
    }
  }

  try {
    const decoded = jwtDecode(token);
    const userId = decoded?.id || decoded?.user?.id;
    if (userId) {
      await AsyncStorage.setItem('userId', String(userId));
    }
  } catch (e) {
    console.warn('JWT decode failed:', e.message);
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io('https://letsmeet-backend-47lv.onrender.com', {
    auth: {token},
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    pingTimeout: 25000,
    pingInterval: 10000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected');
    initialized = true;
    connecting = false;
  });

  socket.on('disconnect', reason => {
    console.warn('⚠️ Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      socket.connect(); // manual reconnect
    }
  });

  socket.on('connect_error', err => {
    console.error('❌ Socket connection error:', err.message);
    connecting = false;
  });

  return new Promise((resolve, reject) => {
    socket.once('connect', () => {
      resolve(socket);
    });
    socket.once('connect_error', reject);
  });
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Socket not connected yet');
    return null;
  }
  return socket;
};
