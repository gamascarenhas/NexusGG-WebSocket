export interface Usuario {
  id: string;
  nome: string;
  cor: string;         // cor pastel gerada no cadastro
  criado_em: string;
}

export type StatusMensagem = 'pendente' | 'enviada' | 'entregue' | 'lida';

export interface Mensagem {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  status: StatusMensagem;
  criado_em: string;
  idTemporario?: string; // ID local enquanto aguarda confirmação do servidor
}

export type TipoEventoWS =
  | 'usuario_conectado'
  | 'lista_usuarios'
  | 'mensagem_enviar'
  | 'mensagem_receber'
  | 'status_mensagem'
  | 'mensagem_lida'
  | 'usuario_entrou'
  | 'usuario_saiu'
  | 'usuario_atualizado'
  | 'usuario_removido';

export interface EventoWS {
  tipo: TipoEventoWS;
  dados: Record<string, unknown>;
}
