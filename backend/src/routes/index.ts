import { Router } from 'express';
import { UsuarioController } from '../controllers/UsuarioController';
import { MensagemController } from '../controllers/MensagemController';

const router = Router();

// Rotas de usuários
router.post('/usuarios',      UsuarioController.criar);
router.get('/usuarios',       UsuarioController.listar);
router.put('/usuarios/:id',   UsuarioController.atualizar);
router.delete('/usuarios/:id', UsuarioController.remover);

// Rotas de mensagens (rota específica antes da genérica)
router.get('/mensagens/nao-lidas/:usuarioId', MensagemController.contarNaoLidas);
router.get('/mensagens/:usuarioId1/:usuarioId2', MensagemController.buscarConversa);

export default router;
