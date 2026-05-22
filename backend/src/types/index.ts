// Representa um usuário no sistema
export interface Usuario {
  id: string;
  nome: string;
  cor: string;       // cor pastel gerada na criação, salva no banco
  criado_em: Date;
}

// Status possíveis de uma mensagem
export type StatusMensagem = 'pendente' | 'enviada' | 'entregue' | 'lida';

// Representa uma mensagem de chat
export interface Mensagem {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  status: StatusMensagem;
  criado_em: Date;
}

// Tipos de eventos WebSocket trocados entre cliente e servidor
export type TipoEventoWS =
  | 'usuario_conectado'     // cliente informa seu id ao conectar
  | 'lista_usuarios'        // servidor envia lista de usuários
  | 'mensagem_enviar'       // cliente quer enviar mensagem
  | 'mensagem_receber'      // servidor entrega mensagem ao destinatário
  | 'status_mensagem'       // atualização de status de mensagem
  | 'mensagem_lida'         // cliente marcou conversa como lida
  | 'usuario_entrou'        // novo usuário conectou
  | 'usuario_saiu'          // usuário desconectou
  | 'usuario_atualizado'    // dados do usuário foram alterados
  | 'usuario_removido';     // usuário foi removido

export interface EventoWS {
  tipo: TipoEventoWS;
  dados: Record<string, unknown>;
}
