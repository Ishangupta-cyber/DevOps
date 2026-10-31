import express from 'express';
import os from 'node:os';

const todoCacheKey = 'todos:all';

export function createApp({ repository, cache }) {
  const app = express();
  app.use(express.json());

  // Tells which api replica answered; the hostname is the container ID.
  app.use((_request, response, next) => {
    response.set('X-Served-By', os.hostname());
    next();
  });

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/todos', async (_request, response, next) => {
    try {
      const cachedTodos = await cache.get(todoCacheKey);
      if (cachedTodos) {
        return response.json(JSON.parse(cachedTodos));
      }

      const todos = await repository.list();
      await cache.set(todoCacheKey, JSON.stringify(todos), { EX: 30 });
      return response.json(todos);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/todos', async (request, response, next) => {
    try {
      const title = request.body?.title?.trim();
      if (!title || title.length > 200) {
        return response.status(400).json({ error: 'Title must be between 1 and 200 characters.' });
      }

      const todo = await repository.create(title);
      await cache.del(todoCacheKey);
      return response.status(201).json(todo);
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/todos/:id', async (request, response, next) => {
    try {
      const updates = {};
      if (typeof request.body?.completed === 'boolean') {
        updates.completed = request.body.completed;
      }
      if (typeof request.body?.title === 'string') {
        const title = request.body.title.trim();
        if (!title || title.length > 200) {
          return response.status(400).json({ error: 'Title must be between 1 and 200 characters.' });
        }
        updates.title = title;
      }
      if (Object.keys(updates).length === 0) {
        return response.status(400).json({ error: 'Provide a valid title or completed value.' });
      }

      const todo = await repository.update(request.params.id, updates);
      if (!todo) {
        return response.status(404).json({ error: 'Todo not found.' });
      }
      await cache.del(todoCacheKey);
      return response.json(todo);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/todos/:id', async (request, response, next) => {
    try {
      const deleted = await repository.remove(request.params.id);
      if (!deleted) {
        return response.status(404).json({ error: 'Todo not found.' });
      }
      await cache.del(todoCacheKey);
      return response.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}