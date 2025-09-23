import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';
import { io } from 'socket.io-client';
import { BASE_URL } from '@env';

let socket = null;
let initialized = false;
let connectingPromise = null;

export const connectSocket = async (passedToken = null) => {
  if (initialized && socket?.connected) {return socket;}

  if (connectingPromise) {return connectingPromise;}

  connectingPromise = (async () => {
    let token = passedToken;
    if (!token) {token = await AsyncStorage.getItem('token');}
    if (!token) {
      connectingPromise = null;
      console.warn('⚠️ No token found. Skipping socket connection.');
      return null;
    }

    try {
      const decoded = jwtDecode(token);
      const userId = decoded?.id || decoded?.user?.id;
      if (userId) {await AsyncStorage.setItem('userId', String(userId));}
    } catch (e) {
      console.warn('JWT decode failed:', e.message);
    }

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    socket = io(BASE_URL, {
      auth: { token },
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
    });

    socket.on('disconnect', reason => {
      console.warn('⚠️ Socket disconnected:', reason);
      // Optional: reset initialized flag
      initialized = false;
    });

    socket.on('connect_error', err => {
      console.error('❌ Socket connection error:', err.message);
    });

    return new Promise((resolve, reject) => {
      socket.once('connect', () => {
        connectingPromise = null;
        resolve(socket);
      });
      socket.once('connect_error', err => {
        connectingPromise = null;
        reject(err);
      });
    });
  })();

  return connectingPromise;
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    console.warn('⚠️ Socket not connected yet');
    return null;
  }
  return socket;
};
