const listEl = document.getElementById("list");
const inputEl = document.getElementById("nameInput");
const addBtn = document.getElementById("addBtn");
const errorEl = document.getElementById("error");

async function fetchNames() {
  errorEl.textContent = "";
  try {
    const res = await fetch("/api/names");
    const data = await res.json();
    renderList(data);
  } catch (e) {
    errorEl.textContent = "Failed to load names.";
  }
}

function renderList(items) {
  listEl.innerHTML = "";
  if (items.length === 0) {
    listEl.innerHTML =
      '<li style="color: #666; font-style: italic;">No names yet</li>';
    return;
  }

  items.forEach((row, index) => {
    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${index + 1}. ${row.name}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => removeName(row.id);
    deleteBtn.title = "Delete";

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  });
}

async function addName() {
  const name = (inputEl.value || "").trim();
  if (!name) {
    errorEl.textContent = "Name cannot be empty.";
    return;
  }
  errorEl.textContent = "";

  try {
    const res = await fetch("/api/names", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      errorEl.textContent = data.error || "Failed to add name.";
      return;
    }
    inputEl.value = "";
    fetchNames();
  } catch (e) {
    errorEl.textContent = "Failed to add name.";
  }
}

async function removeName(id) {
  errorEl.textContent = "";
  try {
    const res = await fetch(`/api/names/${id}`, { method: "DELETE" });
    if (!res.ok) {
      errorEl.textContent = "Failed to delete.";
      return;
    }
    fetchNames();
  } catch (e) {
    errorEl.textContent = "Failed to delete.";
  }
}

inputEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addName();
});

addBtn.onclick = addName;
fetchNames();
