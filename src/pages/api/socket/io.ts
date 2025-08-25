import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "@/types/next";
import { Server } from "socket.io";
import { setServerSocket } from "@/lib/socket";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method !== "GET") {
    console.error("Method not allowed:", req.method);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Prevent multiple server instances
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server");
    const io = new Server(res.socket.server, {
      path: "/api/socket/io",
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    // Set the server-side Socket.IO instance
    setServerSocket(io);

    io.on("connection", (socket) => {
      console.log("🔌 New client connected:", socket.id);

      // Handle joining room (based on publicId or conversationId)
      socket.on("join", (data: { publicId?: string; conversationId?: string }) => {
        if (data.publicId) {
          socket.join(data.publicId);
          console.log("Client joined user room:", { publicId: data.publicId });
        }
        if (data.conversationId) {
          socket.join(data.conversationId);
          console.log("Client joined conversation room:", { conversationId: data.conversationId });
        }
      });

      // Handle leaving room
      socket.on("leave", (data: { conversationId: string }) => {
        socket.leave(data.conversationId);
        console.log("Client left conversation room:", { conversationId: data.conversationId });
      });

      // Handle typing event
      socket.on("typing", async (data: { conversationId: string; userId: string; userName?: string }) => {
        try {
          const { conversationId, userId, userName } = data;
          if (!conversationId || !userId) {
            console.error("Invalid typing data:", data);
            return;
          }
          io.to(conversationId).emit("typing", {
            conversationId,
            userId,
            userName: userName || "Someone",
          });
        } catch (error) {
          console.error(" Socket typing error:", { data, error });
        }
      });

      socket.on("disconnect", () => {
        console.log("🔌 Client disconnected:", socket.id);
      });
    });
  } else {
    console.log("🔌 Socket.IO server already initialized");
  }

  res.end();
}