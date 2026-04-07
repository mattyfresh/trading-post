import { io } from "socket.io-client";

// Connect to the same host as the API (port 3001 in dev)
const SOCKET_URL = "http://localhost:3001";

// Create socket with autoConnect: false so we control when it connects
// (only after the user is authenticated)
export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
