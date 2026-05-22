import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexões com o PostgreSQL
// Reutiliza conexões em vez de abrir uma nova a cada query
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do banco:', err);
});

export default pool;
