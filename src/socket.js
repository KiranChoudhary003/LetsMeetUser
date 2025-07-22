import { io } from "socket.io-client";
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;
let initialized = false;
let connecting = false;

export const connectSocket = async () => {
  if (initialized && socket && socket.connected) {
    console.log("♻️ Reusing already connected socket:", socket.id);
    return socket;
  }

  // Prevent multiple simultaneous attempts
  if (connecting) {
    console.log("⏳ Socket is currently connecting. Waiting for completion...");
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (initialized && socket?.connected) {
          clearInterval(interval);
          resolve(socket);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error("⏱️ Timeout while waiting for socket to connect"));
      }, 5000);
    });
  }

  connecting = true;

  let token = await AsyncStorage.getItem('token');

  if (!token) {
    console.log("🔑 No stored token found. You may need to authenticate first.");
  } else {
    console.log("🗝️ Using stored token for authentication:", token.slice(0, 10) + '...');
  }

  if (socket) {
    console.log("🔄 Disconnecting previous socket instance...");
    socket.disconnect();
  }

  console.log("🌐 Establishing new socket connection...");

  socket = io("https://letsmeet-backend-47lv.onrender.com", {
    auth: { token },
    transports: ["websocket"],
  });

  return new Promise((resolve, reject) => {
    socket.on("connect", () => {
      console.log("✅ Socket connected successfully:", socket.id);
      initialized = true;
      connecting = false;
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket connection failed:", err.message);
      connecting = false;
      reject(err);
    });
  });
};

export const getSocket = () => {
  if (!socket) throw new Error("🚫 Socket not initialized. Call connectSocket() first.");
  return socket;
};
