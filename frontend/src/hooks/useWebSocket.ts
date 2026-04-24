import { useRef, useEffect, useCallback, useState } from "react";
import type { WsMessage } from "../types";

export function useWebSocket(caseId: string, token: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/cases/${caseId}?token=${token}`
    );

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      const msg: WsMessage = JSON.parse(event.data);
      setLastMessage(msg);
    };

    wsRef.current = ws;
  }, [caseId, token]);

  const send = useCallback((msg: WsMessage) => {
    wsRef.current?.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    connect();
    const interval = setInterval(() => {
      send({ type: "heartbeat" });
    }, 30000);
    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, [connect, send]);

  return { lastMessage, connected, send };
}
