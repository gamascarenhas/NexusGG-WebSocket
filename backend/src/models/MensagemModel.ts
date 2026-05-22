import pool from "../database/conexao";
import { Mensagem, StatusMensagem } from "../types";

// Responsável por interagir com a tabela "mensagens" no banco
export const MensagemModel = {
  // Salva uma nova mensagem no banco
  async criar(
    remetenteId: string,
    destinatarioId: string,
    conteudo: string,
  ): Promise<Mensagem> {
    const result = await pool.query<Mensagem>(
      `INSERT INTO mensagens (remetente_id, destinatario_id, conteudo, status)
       VALUES ($1, $2, $3, 'enviada') RETURNING *`,
      [remetenteId, destinatarioId, conteudo],
    );
    return result.rows[0];
  },

  // Busca todas as mensagens entre dois usuários, em ordem cronológica
  async buscarConversa(
    usuarioId1: string,
    usuarioId2: string,
  ): Promise<Mensagem[]> {
    const result = await pool.query<Mensagem>(
      `SELECT * FROM mensagens
       WHERE (remetente_id = $1 AND destinatario_id = $2)
          OR (remetente_id = $2 AND destinatario_id = $1)
       ORDER BY criado_em ASC`,
      [usuarioId1, usuarioId2],
    );
    return result.rows;
  },

  // Atualiza o status de uma única mensagem
  async atualizarStatus(
    mensagemId: string,
    status: StatusMensagem,
  ): Promise<Mensagem | null> {
    const result = await pool.query<Mensagem>(
      "UPDATE mensagens SET status = $1 WHERE id = $2 RETURNING *",
      [status, mensagemId],
    );
    return result.rows[0] ?? null;
  },

  // Marca como "entregue" todas as mensagens recebidas por um usuário que ainda estão "enviada"
  // Chamado quando o usuário conecta ao WebSocket
  async marcarComoEntregue(destinatarioId: string): Promise<Mensagem[]> {
    const result = await pool.query<Mensagem>(
      `UPDATE mensagens SET status = 'entregue'
       WHERE destinatario_id = $1 AND status = 'enviada'
       RETURNING *`,
      [destinatarioId],
    );
    return result.rows;
  },

  // Marca como "lida" todas as mensagens de uma conversa ao abrir o chat
  async marcarConversaComoLida(
    remetenteId: string,
    destinatarioId: string,
  ): Promise<Mensagem[]> {
    const result = await pool.query<Mensagem>(
      `UPDATE mensagens SET status = 'lida'
       WHERE remetente_id = $1 AND destinatario_id = $2 AND status IN ('enviada', 'entregue')
       RETURNING *`,
      [remetenteId, destinatarioId],
    );
    return result.rows;
  },

  // Conta mensagens não lidas agrupadas por remetente para um determinado destinatário
  async contarNaoLidasPorRemetente(
    destinatarioId: string,
  ): Promise<Record<string, number>> {
    const result = await pool.query<{ remetente_id: string; total: string }>(
      `SELECT remetente_id, COUNT(*) AS total
       FROM mensagens
       WHERE destinatario_id = $1 AND status IN ('enviada', 'entregue')
       GROUP BY remetente_id`,
      [destinatarioId],
    );

    return result.rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.remetente_id] = Number(row.total);
      return acc;
    }, {});
  },
};
