"use client";

import { useEffect, useRef, useCallback } from "react";
import { EventoWS } from "../tipos";

const URL_WS = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001/ws";

type ManipuladorEvento = (evento: EventoWS) => void;

export function useWebSocket(
  aoReceberEvento: ManipuladorEvento,
  usuarioId: string | null,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef<ManipuladorEvento>(aoReceberEvento);
  handlerRef.current = aoReceberEvento;

  useEffect(() => {
    if (!usuarioId) return;

    const ws = new WebSocket(URL_WS);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({ tipo: "usuario_conectado", dados: { usuarioId } }),
      );
    };

    ws.onmessage = (e) => {
      try {
        const evento = JSON.parse(e.data as string) as EventoWS;
        handlerRef.current(evento);
      } catch {
        /* ignora malformados */
      }
    };

    ws.onerror = (e) => console.error("WebSocket erro:", e);
    ws.onclose = () => console.log("WebSocket encerrado");

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [usuarioId]);

  const enviarEvento = useCallback((evento: EventoWS) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(evento));
    }
  }, []);

  return { enviarEvento };
}
