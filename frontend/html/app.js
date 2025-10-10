const listEl = document.getElementById('list');
const inputEl = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const errorEl = document.getElementById('error');
const liveEl = document.getElementById('live');

function announce(msg) {
  if (!liveEl) return;
  liveEl.textContent = msg;
}

function setError(msg) {
  errorEl.textContent = msg || '';
  if (msg) announce(msg);
}

function timeit(label, fn) {
  const t0 = performance.now();
  return Promise.resolve(fn()).finally(() => {
    const t1 = performance.now();
    // Optional: console.debug timings
    // console.debug(`${label}: ${(t1 - t0).toFixed(1)}ms`);
  });
}

async function fetchNames() {
  setError('');
  return timeit('fetchNames', async () => {
    try {
      const res = await fetch('/api/names');
      const data = await res.json();
      renderList(data);
    } catch (e) {
      setError('Failed to load names.');
    }
  });
}

function renderList(items) {
  listEl.innerHTML = '';
  if (items.length === 0) {
    listEl.innerHTML = '<li style="color: #666; font-style: italic;">No names yet</li>';
    return;
  }

  items.forEach((row, index) => {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${index + 1}. ${row.name}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => removeName(row.id);
    deleteBtn.setAttribute('aria-label', `Delete ${row.name}`);
    deleteBtn.title = `Delete ${row.name}`;

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  });
}

async function addName() {
  const name = (inputEl.value || '').trim();
  if (!name) {
    setError('Name cannot be empty.');
    inputEl.focus();
    return;
  }
  setError('');
  try {
    const res = await fetch('/api/names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to add name.');
      return;
    }
    inputEl.value = '';
    announce('Name added.');
    fetchNames();
  } catch (e) {
    setError('Failed to add name.');
  }
}

async function removeName(id) {
  setError('');
  try {
    const res = await fetch(`/api/names/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Failed to delete.');
      return;
    }
    announce('Name deleted.');
    fetchNames();
  } catch (e) {
    setError('Failed to delete.');
  }
}

inputEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addName();
});

addBtn.onclick = addName;
fetchNames();
