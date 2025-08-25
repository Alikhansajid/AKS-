import { io as ClientIO } from "socket.io-client";
import { Server } from "socket.io";

// Server-side Socket.IO instance (set in pages/api/socket/io.ts)
let ioServer: Server | null = null;

// Client-side Socket.IO instance
export const socket = ClientIO({
  path: "/api/socket/io",
});

// Set the server-side Socket.IO instance
export function setServerSocket(server: Server) {
  console.log("🔧 Setting Socket.IO server instance");
  ioServer = server;
}

// Get the server-side Socket.IO instance
export function getServerSocket(): Server {
  if (!ioServer) {
    console.error("❌ Socket.IO server not initialized");
    throw new Error("Socket.IO server not initialized");
  }
  console.log("🔌 Retrieving Socket.IO server instance");
  return ioServer;
}