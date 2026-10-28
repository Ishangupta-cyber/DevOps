import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

function createTestApp() {
  let nextId = 1;
  const todos = [];
  const cachedValues = new Map();
  const repository = {
    async list() {
      return todos.map((todo) => ({ ...todo }));
    },
    async create(title) {
      const todo = { id: nextId++, title, completed: false };
      todos.unshift(todo);
      return { ...todo };
    },
    async update(id, updates) {
      const todo = todos.find((item) => item.id === Number(id));
      if (!todo) return null;
      Object.assign(todo, updates);
      return { ...todo };
    },
    async remove(id) {
      const index = todos.findIndex((item) => item.id === Number(id));
      if (index < 0) return false;
      todos.splice(index, 1);
      return true;
    }
  };
  const cache = {
    async get(key) {
      return cachedValues.get(key) ?? null;
    },
    async set(key, value) {
      cachedValues.set(key, value);
    },
    async del(key) {
      cachedValues.delete(key);
    }
  };

  return request(createApp({ repository, cache }));
}

test('creates, lists, updates, and deletes todos', async () => {
  const app = createTestApp();
  const created = await app.post('/api/todos').send({ title: '  Write tests  ' });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body, { id: 1, title: 'Write tests', completed: false });

  const listed = await app.get('/api/todos');
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body, [created.body]);

  const updated = await app.patch('/api/todos/1').send({ completed: true });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.completed, true);

  const deleted = await app.delete('/api/todos/1');
  assert.equal(deleted.status, 204);
  assert.deepEqual((await app.get('/api/todos')).body, []);
});

test('rejects empty titles and invalid updates', async () => {
  const app = createTestApp();
  assert.equal((await app.post('/api/todos').send({ title: '   ' })).status, 400);
  assert.equal((await app.patch('/api/todos/1').send({})).status, 400);
});

test('returns not found when updating or deleting a missing todo', async () => {
  const app = createTestApp();
  assert.equal((await app.patch('/api/todos/99').send({ completed: true })).status, 404);
  assert.equal((await app.delete('/api/todos/99')).status, 404);
});