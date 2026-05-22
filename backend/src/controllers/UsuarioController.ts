import { Request, Response } from 'express';
import { UsuarioModel } from '../models/UsuarioModel';
import { broadcast } from '../websocket/handler';

// Recebe a requisição HTTP, chama o model e retorna a resposta
export const UsuarioController = {

  // POST /api/usuarios — cria um novo usuário com cor gerada automaticamente
  async criar(req: Request, res: Response): Promise<void> {
    const { nome } = req.body as { nome?: string };

    if (!nome || nome.trim().length < 2) {
      res.status(400).json({ erro: 'Nome deve ter pelo menos 2 caracteres.' });
      return;
    }

    const usuario = await UsuarioModel.criar(nome.trim());
    res.status(201).json(usuario);
  },

  // GET /api/usuarios — lista todos os usuários
  async listar(_req: Request, res: Response): Promise<void> {
    const usuarios = await UsuarioModel.buscarTodos();
    res.json(usuarios);
  },

  // PUT /api/usuarios/:id — atualiza o nome do usuário
  async atualizar(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { nome } = req.body as { nome?: string };

    if (!nome || nome.trim().length < 2) {
      res.status(400).json({ erro: 'Nome deve ter pelo menos 2 caracteres.' });
      return;
    }

    const usuario = await UsuarioModel.atualizar(id, nome.trim());
    if (!usuario) {
      res.status(404).json({ erro: 'Usuário não encontrado.' });
      return;
    }

    // Notifica todos os clientes WS que o nome foi alterado
    broadcast({ tipo: 'usuario_atualizado', dados: { usuario } });
    res.json(usuario);
  },

  // DELETE /api/usuarios/:id — remove o usuário
  async remover(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const removido = await UsuarioModel.remover(id);

    if (!removido) {
      res.status(404).json({ erro: 'Usuário não encontrado.' });
      return;
    }

    // Notifica todos os clientes WS que o usuário foi removido
    broadcast({ tipo: 'usuario_removido', dados: { usuarioId: id } });
    res.status(204).send();
  },
};
