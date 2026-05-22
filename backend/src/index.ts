import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import rotas from './routes';
import { configurarWebSocket } from './websocket/handler';
import { executarMigrations } from './database/migrations';

dotenv.config();

const app = express();
const PORTA = process.env.PORT ?? 3001;

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL ?? '*' }));
app.use(express.json());

// Rotas da API REST
app.use('/api', rotas);

// Servidor HTTP compartilhado com o WebSocket
const servidor = http.createServer(app);

// WebSocket no mesmo servidor, path /ws
const wss = new WebSocketServer({ server: servidor, path: '/ws' });
configurarWebSocket(wss);

// Inicia após garantir que o banco está disponível
async function iniciar(): Promise<void> {
  let tentativas = 10;
  while (tentativas > 0) {
    try {
      await executarMigrations();
      break;
    } catch {
      tentativas--;
      console.log(`Aguardando banco... tentativas restantes: ${tentativas}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  servidor.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORTA}`);
    console.log(`🔌 WebSocket disponível em ws://localhost:${PORTA}/ws`);
  });
}

iniciar();
