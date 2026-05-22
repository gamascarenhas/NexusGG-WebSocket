import { Request, Response } from 'express';
import { MensagemModel } from '../models/MensagemModel';

export const MensagemController = {

  // GET /api/mensagens/:usuarioId1/:usuarioId2 — histórico da conversa
  async buscarConversa(req: Request, res: Response): Promise<void> {
    const { usuarioId1, usuarioId2 } = req.params;

    if (!usuarioId1 || !usuarioId2) {
      res.status(400).json({ erro: 'IDs dos usuários são obrigatórios.' });
      return;
    }

    const mensagens = await MensagemModel.buscarConversa(usuarioId1, usuarioId2);
    res.json(mensagens);
  },

  // GET /api/mensagens/nao-lidas/:usuarioId — contadores de não lidas por remetente
  async contarNaoLidas(req: Request, res: Response): Promise<void> {
    const { usuarioId } = req.params;

    if (!usuarioId) {
      res.status(400).json({ erro: 'ID do usuário é obrigatório.' });
      return;
    }

    const contadores = await MensagemModel.contarNaoLidasPorRemetente(usuarioId);
    res.json(contadores);
  },
};
