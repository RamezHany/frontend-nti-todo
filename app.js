const API_URL = 'http://localhost:5173/api'; // Backend Port + /api prefix

// State
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const todoSection = document.getElementById('todo-section');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const tabBtns = document.querySelectorAll('.tab-btn');

const addTodoForm = document.getElementById('add-todo-form');
const newTodoInput = document.getElementById('new-todo-input');
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const clearAllBtn = document.getElementById('clear-all-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Auth Logic
async function checkAuth() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include' // Important for cookies
        });
        
        if (res.status === 401) {
            showAuth();
            return;
        }

        const data = await res.json();
        
        if (data.authenticated) {
            currentUser = data.user;
            showApp();
        } else {
            showAuth();
        }
    } catch (err) {
        console.error('Auth check failed', err);
        showAuth();
    }
}

function showAuth() {
    authSection.classList.remove('hidden');
    todoSection.classList.add('hidden');
    userInfo.classList.add('hidden');
}

function showApp() {
    authSection.classList.add('hidden');
    todoSection.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    usernameDisplay.textContent = `Hi, ${currentUser.username}`;
    fetchTodos();
}

// Tabs
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const target = btn.dataset.target;
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(target).classList.add('active');
    });
});

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        const data = await res.json();
        
        if (res.ok) {
            currentUser = data.user;
            showApp();
            loginForm.reset();
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (err) {
        console.error(err);
        alert('Login failed');
    }
});

// Signup
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
            credentials: 'include'
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert('Account created! Please login.');
            // Switch to login tab
            tabBtns[0].click();
            signupForm.reset();
        } else {
            alert(data.error || 'Signup failed');
        }
    } catch (err) {
        console.error(err);
        alert('Signup failed');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    await fetch(`${API_URL}/auth/logout`, { credentials: 'include' });
    currentUser = null;
    showAuth();
});

// Todos Logic
async function fetchTodos() {
    try {
        const res = await fetch(`${API_URL}/todos`, { credentials: 'include' });
        if (res.status === 401) {
            showAuth();
            return;
        }
        const todos = await res.json();
        renderTodos(todos);
    } catch (err) {
        console.error('Failed to fetch todos', err);
    }
}

function renderTodos(todos) {
    todoList.innerHTML = '';
    todoCount.textContent = `${todos.length} items left`;
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        li.innerHTML = `
            <span class="todo-text">${todo.title}</span>
            <div class="todo-actions">
                <button class="action-btn edit-btn" onclick="editTodo('${todo._id}', '${todo.title}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="action-btn delete-btn" onclick="deleteTodo('${todo._id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        todoList.appendChild(li);
    });
}

// Add Todo
addTodoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = newTodoInput.value;
    
    try {
        const res = await fetch(`${API_URL}/todos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title }),
            credentials: 'include'
        });
        
        if (res.ok) {
            newTodoInput.value = '';
            fetchTodos();
        }
    } catch (err) {
        console.error('Add failed', err);
    }
});

// Delete Todo
window.deleteTodo = async (id) => {
    if (!confirm('Are you sure?')) return;
    
    try {
        const res = await fetch(`${API_URL}/todos/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (res.ok) fetchTodos();
    } catch (err) {
        console.error('Delete failed', err);
    }
};

// Edit Todo
window.editTodo = async (id, currentTitle) => {
    const newTitle = prompt('Edit task:', currentTitle);
    if (!newTitle || newTitle === currentTitle) return;
    
    try {
        const res = await fetch(`${API_URL}/todos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle }),
            credentials: 'include'
        });
        
        if (res.ok) fetchTodos();
    } catch (err) {
        console.error('Edit failed', err);
    }
};

// Clear All
clearAllBtn.addEventListener('click', async () => {
    if (!confirm('Delete all tasks?')) return;
    
    try {
        const res = await fetch(`${API_URL}/todos/delete-all`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (res.ok) fetchTodos();
    } catch (err) {
        console.error('Clear all failed', err);
    }
});
