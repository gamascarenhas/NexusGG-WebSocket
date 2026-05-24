import { Usuario, Mensagem } from "../tipos";

const URL_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function criarUsuario(nome: string): Promise<Usuario> {
  const res = await fetch(`${URL_API}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { erro: string };
    throw new Error(err.erro);
  }
  return res.json() as Promise<Usuario>;
}

export async function buscarUsuarios(): Promise<Usuario[]> {
  const res = await fetch(`${URL_API}/usuarios`);
  return res.json() as Promise<Usuario[]>;
}

export async function atualizarUsuario(
  id: string,
  nome: string,
): Promise<Usuario> {
  const res = await fetch(`${URL_API}/usuarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { erro: string };
    throw new Error(err.erro);
  }
  return res.json() as Promise<Usuario>;
}

export async function removerUsuario(id: string): Promise<void> {
  const res = await fetch(`${URL_API}/usuarios/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = (await res.json()) as { erro: string };
    throw new Error(err.erro);
  }
}

export async function buscarConversa(
  usuarioId1: string,
  usuarioId2: string,
): Promise<Mensagem[]> {
  const res = await fetch(`${URL_API}/mensagens/${usuarioId1}/${usuarioId2}`);
  return res.json() as Promise<Mensagem[]>;
}

export async function buscarNaoLidas(
  usuarioId: string,
): Promise<Record<string, number>> {
  const res = await fetch(`${URL_API}/mensagens/nao-lidas/${usuarioId}`);
  return res.json() as Promise<Record<string, number>>;
}
