import { Usuario } from "../tipos";

const CHAVE_USUARIO = "nexusgg_usuario_ativo";

export function salvarUsuarioAtivo(usuario: Usuario): void {
  sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function carregarUsuarioAtivo(): Usuario | null {
  if (typeof window === "undefined") return null;
  const salvo = sessionStorage.getItem(CHAVE_USUARIO);
  return salvo ? (JSON.parse(salvo) as Usuario) : null;
}
