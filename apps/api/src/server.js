import 'dotenv/config';
import { createClient } from 'redis';
import pg from 'pg';
import { createApp } from './app.js';

const { Pool } = pg;
const port = Number(process.env.PORT ?? 3000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const cache = createClient({ url: process.env.REDIS_URL });

cache.on('error', (error) => console.error('Redis error:', error));

const repository = {
  async list() {
    const result = await pool.query('SELECT id, title, completed FROM todos ORDER BY id DESC');
    return result.rows;
  },
  async create(title) {
    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed',
      [title]
    );
    return result.rows[0];
  },
  async update(id, updates) {
    const result = await pool.query(
      `UPDATE todos
       SET title = COALESCE($2, title), completed = COALESCE($3, completed)
       WHERE id = $1
       RETURNING id, title, completed`,
      [id, updates.title ?? null, updates.completed ?? null]
    );
    return result.rows[0] ?? null;
  },
  async remove(id) {
    const result = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
};

async function start() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await cache.connect();

  const app = createApp({ repository, cache });
  const server = app.listen(port, () => {
    console.log(`Todo app listening on port ${port}`);
  });

  const shutdown = async () => {
    server.close();
    await Promise.all([pool.end(), cache.quit()]);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(async (error) => {
  console.error('Could not start the todo app:', error);
  await Promise.allSettled([pool.end(), cache.quit()]);
  process.exitCode = 1;
});