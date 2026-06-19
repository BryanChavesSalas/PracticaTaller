// ===== ESTADO =====
let tasks = [];
let draggedId = null;
let editingId = null;

const STORAGE_KEY = 'kanflow_tasks';

// ===== PERSISTENCIA =====
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
}

// ===== CREAR TAREA =====
function createTask(title, desc, column) {
  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: title.trim(),
    desc: desc.trim(),
    column,
    createdAt: Date.now(),
  };
}

// ===== RENDER =====
function renderBoard() {
  const columns = ['pendiente', 'progreso', 'hecho'];

  columns.forEach(col => {
    const list = document.getElementById(`list-${col}`);
    const countEl = document.getElementById(`count-${col}`);
    const colTasks = tasks.filter(t => t.column === col);

    list.innerHTML = '';

    if (colTasks.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">◎</span>
          <span>Sin tareas</span>
        </div>`;
    } else {
      colTasks.forEach(task => {
        list.appendChild(buildCard(task));
      });
    }

    countEl.textContent = colTasks.length;
  });
}

function buildCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.dataset.id = task.id;
  card.draggable = true;

  card.innerHTML = `
    <div class="task-title">${escapeHtml(task.title)}</div>
    ${task.desc ? `<div class="task-desc">${escapeHtml(task.desc)}</div>` : ''}
  `;

  // Abrir modal de edición al hacer click
  card.addEventListener('click', () => openEditModal(task.id));

  // Drag events
  card.addEventListener('dragstart', e => {
    draggedId = task.id;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    draggedId = null;
    card.classList.remove('dragging');
  });

  return card;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== DRAG & DROP =====
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDrop(e, targetColumn) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  if (!draggedId) return;

  const task = tasks.find(t => t.id === draggedId);
  if (task && task.column !== targetColumn) {
    task.column = targetColumn;
    saveTasks();
    renderBoard();
  }

  draggedId = null;
}

// ===== MODAL: NUEVA TAREA =====
function openNewModal() {
  document.getElementById('newTitle').value = '';
  document.getElementById('newDesc').value = '';
  document.getElementById('newColumn').value = 'pendiente';
  document.getElementById('modalNew').classList.add('open');
  document.getElementById('newTitle').focus();
}

function closeNewModal() {
  document.getElementById('modalNew').classList.remove('open');
}

function saveNewTask() {
  const title = document.getElementById('newTitle').value.trim();
  if (!title) {
    document.getElementById('newTitle').focus();
    return;
  }
  const desc   = document.getElementById('newDesc').value;
  const column = document.getElementById('newColumn').value;

  tasks.push(createTask(title, desc, column));
  saveTasks();
  renderBoard();
  closeNewModal();
}

// ===== MODAL: EDITAR TAREA =====
function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  editingId = id;
  document.getElementById('editTitle').value  = task.title;
  document.getElementById('editDesc').value   = task.desc;
  document.getElementById('editColumn').value = task.column;
  document.getElementById('modalEdit').classList.add('open');
  document.getElementById('editTitle').focus();
}

function closeEditModal() {
  document.getElementById('modalEdit').classList.remove('open');
  editingId = null;
}

function saveEditTask() {
  if (!editingId) return;
  const title = document.getElementById('editTitle').value.trim();
  if (!title) {
    document.getElementById('editTitle').focus();
    return;
  }

  const task = tasks.find(t => t.id === editingId);
  if (task) {
    task.title  = title;
    task.desc   = document.getElementById('editDesc').value.trim();
    task.column = document.getElementById('editColumn').value;
    saveTasks();
    renderBoard();
  }

  closeEditModal();
}

function deleteTask() {
  if (!editingId) return;
  tasks = tasks.filter(t => t.id !== editingId);
  saveTasks();
  renderBoard();
  closeEditModal();
}

// ===== MODAL: CONFIRMAR LIMPIAR =====
function openConfirmModal() {
  document.getElementById('modalConfirm').classList.add('open');
}

function closeConfirmModal() {
  document.getElementById('modalConfirm').classList.remove('open');
}

function clearBoard() {
  tasks = [];
  saveTasks();
  renderBoard();
  closeConfirmModal();
}

// ===== CERRAR MODALES CON OVERLAY =====
function setupOverlayClose(overlayId, closeFn) {
  document.getElementById(overlayId).addEventListener('click', e => {
    if (e.target.id === overlayId) closeFn();
  });
}

// ===== TECLA ESCAPE =====
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeNewModal();
  closeEditModal();
  closeConfirmModal();
});

// ===== WIRING =====
document.getElementById('btnNewTask').addEventListener('click', openNewModal);
document.getElementById('closeModalNew').addEventListener('click', closeNewModal);
document.getElementById('cancelNew').addEventListener('click', closeNewModal);
document.getElementById('saveNew').addEventListener('click', saveNewTask);

document.getElementById('closeModalEdit').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
document.getElementById('saveEdit').addEventListener('click', saveEditTask);
document.getElementById('deleteTask').addEventListener('click', deleteTask);

document.getElementById('btnClear').addEventListener('click', openConfirmModal);
document.getElementById('closeModalConfirm').addEventListener('click', closeConfirmModal);
document.getElementById('cancelConfirm').addEventListener('click', closeConfirmModal);
document.getElementById('confirmClear').addEventListener('click', clearBoard);

setupOverlayClose('modalNew', closeNewModal);
setupOverlayClose('modalEdit', closeEditModal);
setupOverlayClose('modalConfirm', closeConfirmModal);

// Enter en el campo título para guardar
document.getElementById('newTitle').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveNewTask();
});
document.getElementById('editTitle').addEventListener('keydown', e => {
  if (e.key === 'Enter') saveEditTask();
});

// ===== ARRANQUE =====
loadTasks();
renderBoard();
