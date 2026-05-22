import pool from './conexao';

// Cria as tabelas necessárias caso ainda não existam
export async function executarMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    // Tabela de usuários — inclui campo "cor" para identidade visual
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome       VARCHAR(100) NOT NULL,
        cor        VARCHAR(7) NOT NULL DEFAULT '#a78bfa',
        criado_em  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Tabela de mensagens com referência à tabela usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS mensagens (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        remetente_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        destinatario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        conteudo         TEXT NOT NULL,
        status           VARCHAR(20) NOT NULL DEFAULT 'enviada',
        criado_em        TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✅ Migrations executadas com sucesso');
  } finally {
    client.release();
  }
}
