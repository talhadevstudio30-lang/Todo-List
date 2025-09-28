const deleteAllBtn = document.getElementById('delete-all');

if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL tasks?')) {
            // Remove the same storage key the app uses and reload so the IIFE re-initializes with an empty list
            localStorage.removeItem('todos-v1');
            location.reload();
        }
    });
}

// Simple Todo list app using localStorage, Tailwind CSS for UI, and vanilla JS.
(function () {
    const STORAGE_KEY = 'todos-v1';
    let todos = [];
    let filter = 'all';
    let dragIndex = null;

    // Elements
    const form = document.getElementById('todo-form');
    const input = document.getElementById('todo-input');
    const list = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const emptyState = document.getElementById('empty-state');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const clearBtn = document.getElementById('clear-completed');

    // Load
    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            todos = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load todos:', e);
            todos = [];
        }
    }

    // Save
    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }

    // Utilities
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    // Add
    function addTodo(text) {
        const trimmed = (text || '').trim();
        if (!trimmed) return;
        todos.unshift({
            id: uid(),
            text: trimmed,
            completed: false,
            createdAt: Date.now()
        });
        save();
        render();
    }

    // Toggle complete
    function toggleTodo(id) {
        const t = todos.find(x => x.id === id);
        if (!t) return;
        t.completed = !t.completed;
        save();
        render();
    }

    // Edit
    function updateTodoText(id, newText) {
        const t = todos.find(x => x.id === id);
        if (!t) return;
        t.text = newText.trim();
        save();
        render();
    }

    // Delete
    function deleteTodo(id) {
        todos = todos.filter(x => x.id !== id);
        save();
        render();
    }

    // Clear completed
    function clearCompleted() {
        todos = todos.filter(x => !x.completed);
        save();
        render();
    }

    // Reorder (drag & drop)
    function reorder(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        const [item] = todos.splice(fromIndex, 1);
        todos.splice(toIndex, 0, item);
        save();
        render();
    }

    // Set filter
    function setFilter(f) {
        filter = f;
        filterBtns.forEach(btn => {
            btn.classList.toggle('bg-slate-100', btn.dataset.filter === f);
        });
        render();
    }

    // Render
    function render() {
        // Filtered list
        const filtered = todos.filter(t => {
            if (filter === 'active') return !t.completed;
            if (filter === 'completed') return t.completed;
            return true;
        });

        // Update empty / count
        itemsLeft.textContent = todos.filter(t => !t.completed).length;
        emptyState.classList.toggle('hidden', todos.length > 0);

        // Render items
        list.innerHTML = '';
        filtered.forEach((t, indexVisible) => {
            const index = todos.findIndex(x => x.id === t.id); // position in todos array

            const li = document.createElement('li');
            li.className = 'sm:flex grid items-center gap-3 p-3 rounded-xl border border-slate-100 shadow-[0px_0px_7px_#d9d9d9] bg-white todo-item flex-wrap';
            li.draggable = true;
            li.dataset.id = t.id;
            li.dataset.index = index;

            // Drag handlers
            li.addEventListener('dragstart', (e) => {
                dragIndex = index;
                li.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            li.addEventListener('dragend', () => {
                dragIndex = null;
                li.classList.remove('dragging');
                cleanupDragOver();
            });
            li.addEventListener('dragover', (e) => {
                e.preventDefault();
                li.classList.add('drag-over');
            });
            li.addEventListener('dragleave', () => {
                li.classList.remove('drag-over');
            });
            li.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetIndex = Number(li.dataset.index);
                li.classList.remove('drag-over');
                if (dragIndex !== null) reorder(dragIndex, targetIndex);
                dragIndex = null;
            });

            // Add image element
            const img = document.createElement('img');
            img.src = 'drag.png'; // Replace with your actual image path
            img.alt = 'Todo item image';
            img.className = 'w-4 h-4 hidden sm:block rounded-full';
            li.appendChild(img);

            // Checkbox with custom design
            const chk = document.createElement('label');
            chk.className = 'checkbox-wrap';

            const nativeCheck = document.createElement('input');
            nativeCheck.type = 'checkbox';
            nativeCheck.checked = t.completed;
            nativeCheck.className = 'native-check';
            nativeCheck.addEventListener('change', () => toggleTodo(t.id));

            const customCheck = document.createElement('span');
            customCheck.className = 'custom-checkbox';
            customCheck.style.backgroundColor = 'red'; // Added red background
            customCheck.innerHTML = `<svg viewBox="0 0 12 10" fill="none">
            <path d="M1 5.5L4 8.5L11 1.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;

            chk.appendChild(nativeCheck);
            chk.appendChild(customCheck);

            // Text / edit container
            const textWrap = document.createElement('div');
            textWrap.className = 'flex-1 min-w-0';

            const textEl = document.createElement('span');
            textEl.className = 'block text-sm text-slate-800 mr-2 break-words';
            if (t.completed) textEl.classList.add('line-through', 'text-slate-400');
            textEl.textContent = t.text;

            // Meta
            const meta = document.createElement('div');
            meta.className = 'text-xs text-slate-400 meta-text';
            const date = new Date(t.createdAt);
            meta.textContent = date.toLocaleString();

            textWrap.appendChild(textEl);
            textWrap.appendChild(meta);

            // Edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 edit-btn flex items-center gap-1';
            editBtn.title = 'Edit task';
            editBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Edit</span>
            `;
            editBtn.addEventListener('click', () => startEdit(t, li, textEl));

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.className = 'px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 delete-btn flex items-center gap-1';
            delBtn.title = 'Delete';
            delBtn.innerHTML = `
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
  <span>Delete</span>
`;
            delBtn.addEventListener('click', () => {
                if (confirm('Delete this task?')) deleteTodo(t.id);
            });
            // Assemble
            li.appendChild(chk);
            li.appendChild(textWrap);
            li.appendChild(editBtn);
            li.appendChild(delBtn);
            list.appendChild(li);

        });

        // If no items after filtering, show a message
        if (filtered.length === 0 && todos.length > 0) {
            const msg = document.createElement('div');
            msg.className = 'text-center text-sm text-slate-400 py-4';
            msg.textContent = 'No tasks match the current filter.';
            list.appendChild(msg);
        }
    }

    function cleanupDragOver() {
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }

    // Start editing inline
    function startEdit(todo, li, textEl) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = todo.text;
        input.className = 'w-full px-2 py-1 border rounded text-sm';
        textEl.replaceWith(input);
        input.focus();
        // Save on blur or Enter, cancel on Escape
        const finish = (saveChange) => {
            input.removeEventListener('blur', onBlur);
            input.removeEventListener('keydown', onKey);
            if (saveChange) {
                const newText = input.value.trim();
                if (newText) updateTodoText(todo.id, newText);
                else deleteTodo(todo.id);
            } else render();
        };
        const onBlur = () => finish(true);
        const onKey = (e) => {
            if (e.key === 'Enter') finish(true);
            if (e.key === 'Escape') finish(false);
        };
        input.addEventListener('blur', onBlur);
        input.addEventListener('keydown', onKey);
    }

    // Bind events
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addTodo(input.value);
        input.value = '';
        input.focus();
    });

    clearBtn.addEventListener('click', () => {
        if (todos.some(t => t.completed) && confirm('Remove all completed tasks?')) {
            clearCompleted();
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Keyboard: press "/" to focus input
    window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== input) {
            e.preventDefault();
            input.focus();
        }
    });

    // Initialize
    load();
    setFilter('all');
    render();
    // Existing line


    // Expose to window for debugging (optional)
    window._todoApp = {
        add: addTodo,
        all: () => todos
    };
})();