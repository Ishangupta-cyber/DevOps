const form = document.querySelector('#todo-form');
const input = document.querySelector('#todo-input');
const list = document.querySelector('#todo-list');
const emptyState = document.querySelector('#empty-state');
const errorMessage = document.querySelector('#error-message');
const filterButtons = document.querySelectorAll('.filter-button');
let todos = [];
let activeFilter = 'all';

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || 'Something went wrong. Please try again.');
  }
  return response.status === 204 ? null : response.json();
}

function showError(message = '') {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}

function render() {
  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === 'open') return !todo.completed;
    if (activeFilter === 'done') return todo.completed;
    return true;
  });
  list.replaceChildren(...visibleTodos.map((todo) => {
    const row = document.createElement('li');
    row.className = `todo-row${todo.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.className = 'todo-check';
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `Mark ${todo.title} ${todo.completed ? 'to do' : 'done'}`);
    checkbox.addEventListener('change', () => updateTodo(todo.id, { completed: checkbox.checked }));

    const title = document.createElement('span');
    title.className = 'todo-title';
    title.textContent = todo.title;

    const removeButton = document.createElement('button');
    removeButton.className = 'delete-button';
    removeButton.type = 'button';
    removeButton.textContent = 'x';
    removeButton.title = 'Delete task';
    removeButton.setAttribute('aria-label', `Delete ${todo.title}`);
    removeButton.addEventListener('click', () => deleteTodo(todo.id));

    row.append(checkbox, title, removeButton);
    return row;
  }));

  const completedCount = todos.filter((todo) => todo.completed).length;
  const percent = todos.length ? Math.round((completedCount / todos.length) * 100) : 0;
  document.querySelector('#progress-value').textContent = `${percent}%`;
  document.querySelector('#nav-count').textContent = String(todos.filter((todo) => !todo.completed).length);
  document.querySelector('#list-count').textContent = `${todos.length} ${todos.length === 1 ? 'task' : 'tasks'}`;
  emptyState.hidden = visibleTodos.length > 0;
  list.hidden = visibleTodos.length === 0;
}

async function loadTodos() {
  todos = await api('/todos');
  render();
}

async function updateTodo(id, updates) {
  try {
    const updated = await api(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
    todos = todos.map((todo) => todo.id === id ? updated : todo);
    showError();
    render();
  } catch (error) {
    showError(error.message);
    await loadTodos();
  }
}

async function deleteTodo(id) {
  try {
    await api(`/todos/${id}`, { method: 'DELETE' });
    todos = todos.filter((todo) => todo.id !== id);
    showError();
    render();
  } catch (error) {
    showError(error.message);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  const submitButton = form.querySelector('button');
  submitButton.disabled = true;
  try {
    const todo = await api('/todos', { method: 'POST', body: JSON.stringify({ title }) });
    todos.unshift(todo);
    input.value = '';
    showError();
    render();
    input.focus();
  } catch (error) {
    showError(error.message);
  } finally {
    submitButton.disabled = false;
  }
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    render();
  });
});

document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('en', {
  weekday: 'long', month: 'long', day: 'numeric'
}).format(new Date()).toUpperCase();

loadTodos().catch((error) => showError(error.message));