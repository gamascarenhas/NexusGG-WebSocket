'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Usuario, Mensagem, EventoWS } from '../../tipos';
import { buscarConversa, buscarNaoLidas } from '../../lib/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { IconeStatusMensagem } from '../../components/IconeStatusMensagem';

// Lê o usuário ativo do sessionStorage
function lerUsuarioAtivo(): Usuario | null {
  if (typeof window === 'undefined') return null;
  const salvo = sessionStorage.getItem('nexusgg_usuario_ativo');
  return salvo ? (JSON.parse(salvo) as Usuario) : null;
}

export default function PaginaChat() {
  const router = useRouter();

  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [naoLidas, setNaoLidas] = useState<Record<string, number>>({});
  const [textoMensagem, setTextoMensagem] = useState('');
  const [exibirConversa, setExibirConversa] = useState(false);

  const refFimMensagens = useRef<HTMLDivElement>(null);
  const refInput = useRef<HTMLInputElement>(null);
  const refUsuarioAtual = useRef<Usuario | null>(null);
  const refUsuarioSelecionado = useRef<Usuario | null>(null);

  // Rola para o fim ao receber novas mensagens
  useEffect(() => {
    refFimMensagens.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Sincroniza refs para uso dentro de closures do WS
  useEffect(() => { refUsuarioAtual.current = usuarioAtual; }, [usuarioAtual]);
  useEffect(() => { refUsuarioSelecionado.current = usuarioSelecionado; }, [usuarioSelecionado]);

  // Carrega usuário ativo do sessionStorage ao montar
  useEffect(() => {
    const usuario = lerUsuarioAtivo();
    if (!usuario) {
      router.replace('/usuarios');
      return;
    }
    setUsuarioAtual(usuario);
  }, [router]);

  // ── Handler de eventos WebSocket ─────────────────────────────────────────
  const aoReceberEventoWS = useCallback((evento: EventoWS) => {
    switch (evento.tipo) {

      case 'lista_usuarios': {
        const chegando = evento.dados.usuarios as Usuario[];
        setUsuarios(chegando);
        break;
      }

      case 'usuario_entrou': {
        const novo = evento.dados.usuario as Usuario;
        setUsuarios((prev) =>
          prev.find((u) => u.id === novo.id)
            ? prev
            : [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome))
        );
        break;
      }

      case 'usuario_saiu': {
        const saiuId = evento.dados.usuarioId as string;
        setUsuarios((prev) => prev.filter((u) => u.id !== saiuId));
        break;
      }

      case 'usuario_atualizado': {
        const atualizado = evento.dados.usuario as Usuario;
        setUsuarios((prev) =>
          prev.map((u) => (u.id === atualizado.id ? atualizado : u))
              .sort((a, b) => a.nome.localeCompare(b.nome))
        );
        setUsuarioSelecionado((sel) => (sel?.id === atualizado.id ? atualizado : sel));
        setUsuarioAtual((cur) => {
          if (cur?.id === atualizado.id) {
            sessionStorage.setItem('nexusgg_usuario_ativo', JSON.stringify(atualizado));
            return atualizado;
          }
          return cur;
        });
        break;
      }

      case 'usuario_removido': {
        const removidoId = evento.dados.usuarioId as string;
        setUsuarios((prev) => prev.filter((u) => u.id !== removidoId));
        setUsuarioSelecionado((sel) => (sel?.id === removidoId ? null : sel));
        setUsuarioAtual((cur) => {
          if (cur?.id === removidoId) {
            sessionStorage.removeItem('nexusgg_usuario_ativo');
            router.replace('/usuarios');
            return null;
          }
          return cur;
        });
        break;
      }

      case 'mensagem_receber': {
        const msg = evento.dados.mensagem as Mensagem;
        const atual = refUsuarioAtual.current;
        const selecionado = refUsuarioSelecionado.current;

        const conversaAberta =
          atual &&
          selecionado &&
          msg.remetente_id === selecionado.id &&
          msg.destinatario_id === atual.id;

        if (conversaAberta) {
          setMensagens((prev) => [...prev, msg]);
        } else if (atual && msg.destinatario_id === atual.id) {
          setNaoLidas((prev) => ({
            ...prev,
            [msg.remetente_id]: (prev[msg.remetente_id] ?? 0) + 1,
          }));
        }
        break;
      }

      case 'status_mensagem': {
        const { idTemporario, mensagem, mensagemId, mensagemIds, status } = evento.dados as {
          idTemporario?: string;
          mensagem?: Mensagem;
          mensagemId?: string;
          mensagemIds?: string[];
          status?: string;
        };

        setMensagens((prev) => {
          // ACK: substitui mensagem temporária pela real
          if (idTemporario && mensagem) {
            return prev.map((m) => (m.idTemporario === idTemporario ? { ...mensagem } : m));
          }
          // Status de uma mensagem específica
          if (mensagemId && status) {
            return prev.map((m) =>
              m.id === mensagemId ? { ...m, status: status as Mensagem['status'] } : m
            );
          }
          // Várias mensagens marcadas como lidas
          if (mensagemIds && status) {
            const ids = new Set(mensagemIds);
            return prev.map((m) =>
              ids.has(m.id) ? { ...m, status: status as Mensagem['status'] } : m
            );
          }
          return prev;
        });
        break;
      }
    }
  }, [router]);

  const { enviarEvento } = useWebSocket(aoReceberEventoWS, usuarioAtual?.id ?? null);

  // Carrega contadores ao entrar
  useEffect(() => {
    if (!usuarioAtual) { setNaoLidas({}); return; }
    buscarNaoLidas(usuarioAtual.id).then(setNaoLidas);
  }, [usuarioAtual]);

  // Carrega histórico ao selecionar contato
  useEffect(() => {
    if (!usuarioSelecionado || !usuarioAtual) return;

    setNaoLidas((prev) => ({ ...prev, [usuarioSelecionado.id]: 0 }));

    buscarConversa(usuarioAtual.id, usuarioSelecionado.id).then((msgs) => {
      setMensagens(msgs);
      enviarEvento({
        tipo: 'mensagem_lida',
        dados: { leidoPorId: usuarioAtual.id, remetenteId: usuarioSelecionado.id },
      });
    });
  }, [usuarioSelecionado, usuarioAtual, enviarEvento]);

  // Marca como lida ao receber mensagem na conversa aberta
  useEffect(() => {
    if (!usuarioSelecionado || !usuarioAtual || mensagens.length === 0) return;
    const ultima = mensagens[mensagens.length - 1];
    if (ultima.remetente_id === usuarioSelecionado.id && ultima.status !== 'lida') {
      enviarEvento({
        tipo: 'mensagem_lida',
        dados: { leidoPorId: usuarioAtual.id, remetenteId: usuarioSelecionado.id },
      });
    }
  }, [mensagens, usuarioSelecionado, usuarioAtual, enviarEvento]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function aoSelecionarContato(usuario: Usuario) {
    setUsuarioSelecionado(usuario);
    setMensagens([]);
    setExibirConversa(true);
  }

  function voltarParaLista() {
    setExibirConversa(false);
    setUsuarioSelecionado(null);
    setMensagens([]);
  }

  function aoTrocarUsuario() {
    sessionStorage.removeItem('nexusgg_usuario_ativo');
    router.push('/usuarios');
  }

  function aoEnviarMensagem(e: React.FormEvent) {
    e.preventDefault();
    if (!textoMensagem.trim() || !usuarioAtual || !usuarioSelecionado) return;

    const idTemporario = uuidv4();
    const mensagemTemp: Mensagem = {
      id: idTemporario,
      idTemporario,
      remetente_id: usuarioAtual.id,
      destinatario_id: usuarioSelecionado.id,
      conteudo: textoMensagem.trim(),
      status: 'pendente',
      criado_em: new Date().toISOString(),
    };

    setMensagens((prev) => [...prev, mensagemTemp]);
    setTextoMensagem('');
    refInput.current?.focus();

    enviarEvento({
      tipo: 'mensagem_enviar',
      dados: {
        remetenteId: usuarioAtual.id,
        destinatarioId: usuarioSelecionado.id,
        conteudo: mensagemTemp.conteudo,
        idTemporario,
      },
    });
  }

  function formatarHora(dataStr: string) {
    return new Date(dataStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Redireciona se não houver usuário ativo
  if (!usuarioAtual) return null;

  const outrosUsuarios = usuarios.filter((u) => u.id !== usuarioAtual.id);

  return (
    <div className={`layout-chat ${exibirConversa ? 'mobile-conversa-ativa' : 'mobile-lista-ativa'}`}>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`sidebar-chat ${exibirConversa ? 'mobile-oculto' : ''}`}>

        {/* Usuário atual */}
        <div className="cabecalho-sidebar">
          <div className="usuario-atual">
            <div className="avatar-usuario avatar-grande" style={{ background: usuarioAtual.cor }}>
              {usuarioAtual.nome[0].toUpperCase()}
            </div>
            <span className="nome-usuario-atual">{usuarioAtual.nome}</span>
          </div>
          <button
            className="btn-trocar-usuario"
            onClick={aoTrocarUsuario}
            title="Trocar usuário"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M17 1l4 4-4 4"/>
              <path d="M3 11V9a4 4 0 014-4h14"/>
              <path d="M7 23l-4-4 4-4"/>
              <path d="M21 13v2a4 4 0 01-4 4H3"/>
            </svg>
          </button>
        </div>

        <p className="rotulo-secao-sidebar">Conversas</p>

        {/* Lista de contatos */}
        <ul className="lista-contatos">
          {outrosUsuarios.length === 0 && (
            <li className="sem-contatos">
              Nenhum outro usuário online.<br />Abra outra aba para testar.
            </li>
          )}
          {outrosUsuarios.map((usuario) => {
            const qtdNaoLidas = naoLidas[usuario.id] ?? 0;
            return (
              <li
                key={usuario.id}
                className={`item-contato ${usuarioSelecionado?.id === usuario.id ? 'ativo' : ''}`}
                onClick={() => aoSelecionarContato(usuario)}
              >
                <div className="avatar-usuario avatar-grande" style={{ background: usuario.cor }}>
                  {usuario.nome[0].toUpperCase()}
                </div>
                <span className="nome-contato">{usuario.nome}</span>
                {qtdNaoLidas > 0 && (
                  <span className="badge-nao-lidas">
                    {qtdNaoLidas > 99 ? '99+' : qtdNaoLidas}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ── Área principal ──────────────────────────────────────────────── */}
      <main className={`area-chat ${!exibirConversa ? 'mobile-oculto' : ''}`}>
        {!usuarioSelecionado ? (
          <div className="estado-vazio-chat">
            <div className="estado-vazio-icone">💬</div>
            <h2>Selecione um contato</h2>
            <p>Escolha alguém na lista ao lado para iniciar uma conversa.</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho da conversa */}
            <header className="cabecalho-conversa">
              {/* Botão voltar — visível apenas no mobile */}
              <button className="btn-voltar-mobile" onClick={voltarParaLista} title="Voltar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"/>
                  <path d="M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="avatar-usuario avatar-grande" style={{ background: usuarioSelecionado.cor }}>
                {usuarioSelecionado.nome[0].toUpperCase()}
              </div>
              <div className="info-conversa">
                <span className="nome-conversa">{usuarioSelecionado.nome}</span>
                <span className="status-conversa">online</span>
              </div>
            </header>

            {/* Mensagens */}
            <div className="area-mensagens">
              {mensagens.map((msg) => {
                const ehPropria = msg.remetente_id === usuarioAtual.id;
                return (
                  <div key={msg.id} className={`wrapper-mensagem ${ehPropria ? 'propria' : 'recebida'}`}>
                    <div className={`balao-mensagem ${ehPropria ? 'balao-propria' : 'balao-recebida'}`}>
                      <p className="texto-mensagem">{msg.conteudo}</p>
                      <div className="meta-mensagem">
                        <span className="hora-mensagem">{formatarHora(msg.criado_em)}</span>
                        {ehPropria && <IconeStatusMensagem status={msg.status} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={refFimMensagens} />
            </div>

            {/* Input de mensagem */}
            <form onSubmit={aoEnviarMensagem} className="formulario-mensagem">
              <input
                ref={refInput}
                type="text"
                value={textoMensagem}
                onChange={(e) => setTextoMensagem(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="input-mensagem"
                autoFocus
              />
              <button type="submit" className="btn-enviar" disabled={!textoMensagem.trim()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
