import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketIOServer | null = null;

export function initWebSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on("subscribe:market", (marketId: number) => {
      socket.join(`market:${marketId}`);
      console.log(`[WebSocket] ${socket.id} subscribed to market:${marketId}`);
    });

    socket.on("unsubscribe:market", (marketId: number) => {
      socket.leave(`market:${marketId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[WebSocket] Socket.IO server initialized at /api/socket.io");
  return io;
}

export function broadcastMarketUpdate(marketId: number, data: {
  yesPrice: string;
  noPrice: string;
  volume: string;
  timestamp: number;
}) {
  if (!io) return;
  io.to(`market:${marketId}`).emit("market:update", { marketId, ...data });
}

export function broadcastTradeNotification(data: {
  marketId: number;
  marketTitle: string;
  side: string;
  quantity: number;
  totalCost: number;
  traderName: string;
}) {
  if (!io) return;
  // Broadcast to all connected clients
  io.emit("trade:notification", data);
}

export function getIO() {
  return io;
}
