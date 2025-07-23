import {io} from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';

let socket = null;
let initialized = false;
let connecting = false;

export const connectSocket = async () => {
  if (initialized && socket && socket.connected) {
    console.log('♻️ Reusing already connected socket:', socket.id);
    return socket;
  }

  if (connecting) {
    console.log('⏳ Socket is currently connecting. Waiting for completion...');
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (initialized && socket?.connected) {
          clearInterval(interval);
          resolve(socket);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('⏱️ Timeout while waiting for socket to connect'));
      }, 5000);
    });
  }

  connecting = true;

  const token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log('🔑 No token found. You may need to login.');
    connecting = false;
    throw new Error('Token not found');
  }

  console.log('🗝️ Using token:', token.slice(0, 10) + '...');

  // ✅ Decode the token to get user ID in frontend only
  try {
    const decoded = jwtDecode(token);
    const userId = decoded?.id || decoded?.user?.id;
    if (userId) {
      await AsyncStorage.setItem('userId', String(userId));
      console.log('✅ Saved userId:', userId);
    } else {
      console.warn('⚠️ No userId found in token');
    }
  } catch (e) {
    console.error('❌ Failed to decode token:', e.message);
  }

  if (socket) {
    console.log('🔄 Disconnecting previous socket...');
    socket.disconnect();
  }

  console.log('🌐 Establishing new socket connection...');

  socket = io('https://letsmeet-backend-47lv.onrender.com', {
    auth: {token},
    // transports: ["websocket"], // OPTIONAL: remove if connection fails
  });

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      initialized = true;
      connecting = false;
      resolve(socket);
    });

    socket.on('connect_error', err => {
      console.log('❌ Socket connection failed:', err.message);
      connecting = false;
      reject(err);
    });
  });
};

export const getSocket = () => {
  if (!socket)
    throw new Error('🚫 Socket not initialized. Call connectSocket() first.');
  return socket;
};
