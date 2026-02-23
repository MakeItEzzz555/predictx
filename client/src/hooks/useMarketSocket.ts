import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface MarketUpdate {
  marketId: number;
  yesPrice: string;
  noPrice: string;
  volume: string;
  timestamp: number;
}

interface TradeNotification {
  marketId: number;
  marketTitle: string;
  side: string;
  quantity: number;
  totalCost: number;
  traderName: string;
}

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io({
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
    });
  }
  return sharedSocket;
}

export function useMarketSocket(marketId: number | undefined) {
  const [latestUpdate, setLatestUpdate] = useState<MarketUpdate | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!marketId) return;
    const socket = getSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onUpdate = (data: MarketUpdate) => {
      if (data.marketId === marketId) {
        setLatestUpdate(data);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("market:update", onUpdate);

    if (socket.connected) setConnected(true);
    socket.emit("subscribe:market", marketId);

    return () => {
      socket.emit("unsubscribe:market", marketId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("market:update", onUpdate);
    };
  }, [marketId]);

  return { latestUpdate, connected };
}

export function useTradeNotifications(
  onNotification: (n: TradeNotification) => void
) {
  const callbackRef = useRef(onNotification);
  callbackRef.current = onNotification;

  useEffect(() => {
    const socket = getSocket();
    const handler = (data: TradeNotification) => callbackRef.current(data);
    socket.on("trade:notification", handler);
    return () => {
      socket.off("trade:notification", handler);
    };
  }, []);
}
