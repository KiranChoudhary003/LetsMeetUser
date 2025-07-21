import { io } from "socket.io-client";
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket = null;

export const connectSocket = async () => {
  if (!socket || !socket.connected) {
    const token = await AsyncStorage.getItem('token');
    socket = io("https://letsmeet-backend-47lv.onrender.com", {
      auth: { token },
      transports: ["websocket"],
    });

    return new Promise((resolve, reject) => {
      socket.on("connect", () => {
        console.log("🔌 Socket ID:", socket.id);
        resolve(socket);
      });

      socket.on("connect_error", (err) => {
        console.log("Connection error", err);
        reject(err);
      });
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) throw new Error("Socket not initialized");
  return socket;
};
