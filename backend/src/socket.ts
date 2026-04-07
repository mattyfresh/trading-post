import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "./middleware/auth.js";

export function setupSocket(io: Server) {
  // Authenticate every incoming connection via JWT
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret"
      ) as JwtPayload;

      // Attach userId to socket data for use in event handlers
      socket.data.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;

    // Each user joins a private room keyed by their userId.
    // We emit new messages to these rooms so only the right users receive them.
    socket.join(userId);
    console.log(`Socket connected: user=${userId} socket=${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: user=${userId} socket=${socket.id}`);
    });
  });
}
