'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Usuario } from '../../tipos';
import { criarUsuario, buscarUsuarios, atualizarUsuario, removerUsuario } from '../../lib/api';

// Persiste o usuário ativo no sessionStorage para navegar entre páginas
const CHAVE_USUARIO = 'nexusgg_usuario_ativo';

export function salvarUsuarioAtivo(usuario: Usuario): void {
  sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function carregarUsuarioAtivo(): Usuario | null {
  if (typeof window === 'undefined') return null;
  const salvo = sessionStorage.getItem(CHAVE_USUARIO);
  return salvo ? (JSON.parse(salvo) as Usuario) : null;
}

export default function PaginaUsuarios() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Criação
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [erroCriacao, setErroCriacao] = useState('');

  // Edição
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');

  // Remoção
  const [confirmarRemoverId, setConfirmarRemoverId] = useState<string | null>(null);

  const refNovoNome = useRef<HTMLInputElement>(null);
  const refNomeEdicao = useRef<HTMLInputElement>(null);

  useEffect(() => {
    buscarUsuarios()
      .then(setUsuarios)
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (criando) refNovoNome.current?.focus();
  }, [criando]);

  useEffect(() => {
    if (editandoId) refNomeEdicao.current?.focus();
  }, [editandoId]);

  // ── Criar ────────────────────────────────────────────────────────────────
  async function aoSubmeterCriacao(e: React.FormEvent) {
    e.preventDefault();
    setErroCriacao('');

    if (novoNome.trim().length < 2) {
      setErroCriacao('Mínimo de 2 caracteres.');
      return;
    }

    try {
      const usuario = await criarUsuario(novoNome.trim());
      setUsuarios((prev) => [...prev, usuario].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoNome('');
      setCriando(false);
    } catch (err) {
      setErroCriacao(err instanceof Error ? err.message : 'Erro ao criar.');
    }
  }

  function cancelarCriacao() {
    setCriando(false);
    setNovoNome('');
    setErroCriacao('');
  }

  // ── Editar ───────────────────────────────────────────────────────────────
  function iniciarEdicao(usuario: Usuario) {
    setEditandoId(usuario.id);
    setNomeEdicao(usuario.nome);
    setErroEdicao('');
    setConfirmarRemoverId(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setNomeEdicao('');
    setErroEdicao('');
  }

  async function aoSubmeterEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editandoId) return;
    setErroEdicao('');

    if (nomeEdicao.trim().length < 2) {
      setErroEdicao('Mínimo de 2 caracteres.');
      return;
    }

    try {
      const atualizado = await atualizarUsuario(editandoId, nomeEdicao.trim());
      setUsuarios((prev) =>
        prev.map((u) => (u.id === atualizado.id ? atualizado : u))
            .sort((a, b) => a.nome.localeCompare(b.nome))
      );
      setEditandoId(null);
    } catch (err) {
      setErroEdicao(err instanceof Error ? err.message : 'Erro ao salvar.');
    }
  }

  // ── Remover ──────────────────────────────────────────────────────────────
  async function aoConfirmarRemocao(id: string) {
    try {
      await removerUsuario(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setConfirmarRemoverId(null);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Entrar no chat ───────────────────────────────────────────────────────
  function entrarComoUsuario(usuario: Usuario) {
    salvarUsuarioAtivo(usuario);
    router.push('/chat');
  }

  return (
    <div className="pagina-usuarios">

      {/* Cabeçalho */}
      <header className="cabecalho-usuarios">
        <div className="marca">
          <div className="marca-icone">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" stroke="white" strokeWidth=".5" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="marca-nome">Nexus<span>GG</span></span>
        </div>

        <button
          className="btn-novo-usuario"
          onClick={() => { setCriando(true); setEditandoId(null); setConfirmarRemoverId(null); }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5"  y1="12" x2="19" y2="12"/>
          </svg>
          Novo usuário
        </button>
      </header>

      {/* Corpo */}
      <div className="corpo-usuarios">

        {/* Formulário de criação */}
        {criando && (
          <form onSubmit={aoSubmeterCriacao} className="formulario-criar">
            <p className="titulo-secao">Novo usuário</p>
            <div className="formulario-criar-linha">
              <input
                ref={refNovoNome}
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Digite um nome..."
                className="campo-texto"
                maxLength={60}
              />
            </div>
            {erroCriacao && <span className="texto-erro-campo">{erroCriacao}</span>}
            <div className="acoes-inline">
              <button type="submit"   className="btn-confirmar">Criar usuário</button>
              <button type="button"   className="btn-cancelar" onClick={cancelarCriacao}>Cancelar</button>
            </div>
          </form>
        )}

        {/* Contagem */}
        {!carregando && (
          <p className="contador-usuarios">
            {usuarios.length === 0
              ? 'Nenhum usuário cadastrado'
              : `${usuarios.length} ${usuarios.length === 1 ? 'usuário' : 'usuários'}`}
          </p>
        )}

        {/* Loading */}
        {carregando && (
          <div className="carregando">
            <div className="girador" />
            Carregando...
          </div>
        )}

        {/* Vazio */}
        {!carregando && usuarios.length === 0 && !criando && (
          <div className="lista-vazia">
            <div className="lista-vazia-icone">👤</div>
            <p>Nenhum usuário ainda.</p>
            <p>Clique em <strong>Novo usuário</strong> para começar.</p>
          </div>
        )}

        {/* Lista */}
        <ul className="lista-usuarios">
          {usuarios.map((usuario) => (
            <li key={usuario.id} className="card-usuario">

              {editandoId === usuario.id ? (
                /* Modo edição */
                <form onSubmit={aoSubmeterEdicao} className="formulario-edicao">
                  <div className="avatar-usuario avatar-grande" style={{ background: usuario.cor }}>
                    {usuario.nome[0].toUpperCase()}
                  </div>
                  <div className="campos-edicao">
                    <input
                      ref={refNomeEdicao}
                      type="text"
                      value={nomeEdicao}
                      onChange={(e) => setNomeEdicao(e.target.value)}
                      className="campo-texto"
                      maxLength={60}
                    />
                    {erroEdicao && <span className="texto-erro-campo">{erroEdicao}</span>}
                    <div className="acoes-inline">
                      <button type="submit"  className="btn-confirmar">Salvar</button>
                      <button type="button"  className="btn-cancelar" onClick={cancelarEdicao}>Cancelar</button>
                    </div>
                  </div>
                </form>

              ) : confirmarRemoverId === usuario.id ? (
                /* Confirmação de remoção */
                <div className="confirmacao-remover">
                  <div className="avatar-usuario avatar-grande" style={{ background: usuario.cor }}>
                    {usuario.nome[0].toUpperCase()}
                  </div>
                  <div className="corpo-confirmacao">
                    <p className="texto-confirmacao">
                      Remover <strong>{usuario.nome}</strong>? Esta ação não pode ser desfeita.
                    </p>
                    <div className="acoes-inline">
                      <button className="btn-perigo"   onClick={() => aoConfirmarRemocao(usuario.id)}>Remover</button>
                      <button className="btn-cancelar" onClick={() => setConfirmarRemoverId(null)}>Cancelar</button>
                    </div>
                  </div>
                </div>

              ) : (
                /* Visualização normal */
                <>
                  <button
                    className="btn-entrar-chat"
                    onClick={() => entrarComoUsuario(usuario)}
                    title={`Entrar como ${usuario.nome}`}
                  >
                    <div className="avatar-usuario" style={{ background: usuario.cor }}>
                      {usuario.nome[0].toUpperCase()}
                    </div>
                    <div className="info-usuario-card">
                      <span className="nome-usuario-card">{usuario.nome}</span>
                      <span className="dica-entrar">Clique para entrar no chat</span>
                    </div>
                  </button>

                  <div className="acoes-card">
                    <button
                      className="btn-icone btn-icone-editar"
                      onClick={() => iniciarEdicao(usuario)}
                      title="Editar nome"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      className="btn-icone btn-icone-remover"
                      onClick={() => { setConfirmarRemoverId(usuario.id); setEditandoId(null); }}
                      title="Remover usuário"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
