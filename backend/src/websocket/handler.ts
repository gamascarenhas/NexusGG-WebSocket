import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { MensagemModel } from '../models/MensagemModel';
import { UsuarioModel } from '../models/UsuarioModel';
import { EventoWS } from '../types';

// Mapa que associa usuarioId -> WebSocket ativo
const clientesConectados = new Map<string, WebSocket>();

// Envia um evento JSON para um WebSocket específico
function enviarPara(ws: WebSocket, evento: EventoWS): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(evento));
  }
}

// Envia um evento para todos os clientes conectados
// Exportada para que controllers possam notificar via HTTP
export function broadcast(evento: EventoWS, excluirId?: string): void {
  clientesConectados.forEach((ws, id) => {
    if (id !== excluirId) {
      enviarPara(ws, evento);
    }
  });
}

export function configurarWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    // ID do usuário desta conexão — definido após o evento 'usuario_conectado'
    let usuarioAtualId: string | null = null;

    ws.on('message', async (raw) => {
      let evento: EventoWS;

      try {
        evento = JSON.parse(raw.toString()) as EventoWS;
      } catch {
        return; // ignora mensagens malformadas
      }

      // ── EVENTO: usuario_conectado ──────────────────────────────────────
      if (evento.tipo === 'usuario_conectado') {
        const usuarioId = evento.dados.usuarioId as string;
        usuarioAtualId = usuarioId;
        clientesConectados.set(usuarioId, ws);

        const usuario = await UsuarioModel.buscarPorId(usuarioId);
        if (!usuario) return;

        console.log(`🟢 ${usuario.nome} conectou`);

        // 1. Marca mensagens pendentes como "entregue" (usuário está online)
        const mensagensEntregues = await MensagemModel.marcarComoEntregue(usuarioId);

        // 2. Notifica remetentes que as mensagens foram entregues
        for (const msg of mensagensEntregues) {
          const wsRemetente = clientesConectados.get(msg.remetente_id);
          if (wsRemetente) {
            enviarPara(wsRemetente, {
              tipo: 'status_mensagem',
              dados: { mensagemId: msg.id, status: 'entregue' },
            });
          }
        }

        // 3. Envia lista completa de usuários para quem acabou de conectar
        const todosUsuarios = await UsuarioModel.buscarTodos();
        enviarPara(ws, { tipo: 'lista_usuarios', dados: { usuarios: todosUsuarios } });

        // 4. Avisa os demais que um novo usuário entrou
        broadcast({ tipo: 'usuario_entrou', dados: { usuario } }, usuarioId);
      }

      // ── EVENTO: mensagem_enviar ────────────────────────────────────────
      else if (evento.tipo === 'mensagem_enviar') {
        const { remetenteId, destinatarioId, conteudo, idTemporario } = evento.dados as {
          remetenteId: string;
          destinatarioId: string;
          conteudo: string;
          idTemporario: string; // ID local do frontend para rastrear antes do ACK
        };

        const mensagem = await MensagemModel.criar(remetenteId, destinatarioId, conteudo);

        // Confirma para o remetente que a mensagem foi salva
        const wsRemetente = clientesConectados.get(remetenteId);
        if (wsRemetente) {
          enviarPara(wsRemetente, {
            tipo: 'status_mensagem',
            dados: { idTemporario, mensagem },
          });
        }

        // Entrega ao destinatário se ele estiver online
        const wsDestinatario = clientesConectados.get(destinatarioId);
        if (wsDestinatario) {
          const atualizada = await MensagemModel.atualizarStatus(mensagem.id, 'entregue');

          enviarPara(wsDestinatario, {
            tipo: 'mensagem_receber',
            dados: { mensagem: atualizada ?? mensagem },
          });

          if (wsRemetente) {
            enviarPara(wsRemetente, {
              tipo: 'status_mensagem',
              dados: { mensagemId: mensagem.id, status: 'entregue' },
            });
          }
        }
      }

      // ── EVENTO: mensagem_lida ──────────────────────────────────────────
      else if (evento.tipo === 'mensagem_lida') {
        const { leidoPorId, remetenteId } = evento.dados as {
          leidoPorId: string;
          remetenteId: string;
        };

        const mensagensLidas = await MensagemModel.marcarConversaComoLida(remetenteId, leidoPorId);

        const wsRemetente = clientesConectados.get(remetenteId);
        if (wsRemetente && mensagensLidas.length > 0) {
          enviarPara(wsRemetente, {
            tipo: 'status_mensagem',
            dados: {
              mensagemIds: mensagensLidas.map((m) => m.id),
              status: 'lida',
            },
          });
        }
      }
    });

    // ── DESCONEXÃO ─────────────────────────────────────────────────────
    ws.on('close', async () => {
      if (!usuarioAtualId) return;

      const usuario = await UsuarioModel.buscarPorId(usuarioAtualId);
      clientesConectados.delete(usuarioAtualId);

      console.log(`🔴 ${usuario?.nome ?? usuarioAtualId} desconectou`);

      broadcast({ tipo: 'usuario_saiu', dados: { usuarioId: usuarioAtualId } });
    });

    ws.on('error', (err) => {
      console.error('Erro no WebSocket:', err.message);
    });
  });
}
