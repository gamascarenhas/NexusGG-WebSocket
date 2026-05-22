import pool from "../database/conexao";
import { Usuario } from "../types";
import { gerarCorPastel } from "../utils/gerarCorPastel";

// Responsável por interagir com a tabela "usuarios" no banco
export const UsuarioModel = {
  // Cria um novo usuário com nome e cor pastel gerada automaticamente
  async criar(nome: string): Promise<Usuario> {
    const cor = gerarCorPastel();
    const result = await pool.query<Usuario>(
      "INSERT INTO usuarios (nome, cor) VALUES ($1, $2) RETURNING *",
      [nome, cor],
    );
    return result.rows[0];
  },

  // Retorna todos os usuários ordenados por nome
  async buscarTodos(): Promise<Usuario[]> {
    const result = await pool.query<Usuario>(
      "SELECT * FROM usuarios ORDER BY nome ASC",
    );
    return result.rows;
  },

  // Busca um usuário pelo ID
  async buscarPorId(id: string): Promise<Usuario | null> {
    const result = await pool.query<Usuario>(
      "SELECT * FROM usuarios WHERE id = $1",
      [id],
    );
    return result.rows[0] ?? null;
  },

  // Atualiza apenas o nome do usuário (cor não muda após criação)
  async atualizar(id: string, nome: string): Promise<Usuario | null> {
    const result = await pool.query<Usuario>(
      "UPDATE usuarios SET nome = $1 WHERE id = $2 RETURNING *",
      [nome, id],
    );
    return result.rows[0] ?? null;
  },

  // Remove um usuário
  async remover(id: string): Promise<boolean> {
    const result = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
