// ==========================================
// MODUL A - Storage Manager
// ==========================================
const StorageManager = {
    STORAGE_KEY: 'tasks',

    getTasks() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Greška pri učitavanju podataka:', error);
            return [];
        }
    },

    saveTasks(tasks) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Greška pri spremanju podataka:', error);
            return false;
        }
    }
};

// ==========================================
// MODUL B - Task Manager
// ==========================================
const TaskManager = {
    tasks: [],

    init() {
        this.tasks = StorageManager.getTasks();
    },

    addTask(title, date, category) {
        const task = {
            id: 'task_' + Date.now(),
            title: title,
            date: date,
            category: category,
            completed: false
        };
        this.tasks.push(task);
        StorageManager.saveTasks(this.tasks);
        return task;
    },

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        StorageManager.saveTasks(this.tasks);
    },

    toggleComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            StorageManager.saveTasks(this.tasks);
        }
    },

    getTasks(filter = 'all') {
        if (filter === 'all') {
            return this.tasks;
        } else if (filter === 'active') {
            return this.tasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            return this.tasks.filter(task => task.completed);
        } else {
            return this.tasks.filter(task => task.category === filter);
        }
    },

    getMonthlyStats() {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const total = this.tasks.length;
        const pending = this.tasks.filter(task => !task.completed).length;
        const completed = this.tasks.filter(task => task.completed).length;
        const upcoming = this.tasks.filter(task => {
            const taskDate = new Date(task.date);
            return !task.completed && taskDate >= now && taskDate <= sevenDaysFromNow;
        }).length;

        return { total, pending, completed, upcoming };
    }
};

// ==========================================
// MODUL C - UI Renderer
// ==========================================
const UIRenderer = {
    currentFilter: 'all',

    init() {
        this.updateMonthlyOverview();
        this.renderTasks();
        this.setupEventListeners();
    },

    updateMonthlyOverview() {
        const months = ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj', 
                       'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];
        const now = new Date();
        const monthName = months[now.getMonth()];
        const year = now.getFullYear();

        document.getElementById('current-month').textContent = `${monthName} ${year}`;

        const stats = TaskManager.getMonthlyStats();
        document.getElementById('total-tasks').textContent = stats.total;
        document.getElementById('pending-tasks').textContent = stats.pending;
        document.getElementById('completed-tasks').textContent = stats.completed;
        document.getElementById('upcoming-tasks').textContent = stats.upcoming;
    },

    renderTasks() {
        const tasksList = document.getElementById('tasks-list');
        const tasks = TaskManager.getTasks(this.currentFilter);

        if (tasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <p>Nema obveza u ovoj kategoriji.</p>
                </div>
            `;
            return;
        }

        // Sortiraj po datumu
        tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

        tasksList.innerHTML = tasks.map(task => {
            const date = new Date(task.date);
            const formattedDate = date.toLocaleDateString('hr-HR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });

            return `
                <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-info">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span class="task-date">📅 ${formattedDate}</span>
                            <span class="task-category category-${task.category.toLowerCase()}">${task.category}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn complete-btn" onclick="UIRenderer.toggleTask('${task.id}')">
                            ${task.completed ? '↩️' : '✓'}
                        </button>
                        <button class="action-btn delete-btn" onclick="UIRenderer.deleteTask('${task.id}')">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    setupEventListeners() {
        // Form submit
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('task-title').value;
            const date = document.getElementById('task-date').value;
            const category = document.getElementById('task-category').value;

            TaskManager.addTask(title, date, category);
            this.updateMonthlyOverview();
            this.renderTasks();

            // Reset forme
            e.target.reset();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.renderTasks();
            });
        });
    },

    toggleTask(id) {
        TaskManager.toggleComplete(id);
        this.updateMonthlyOverview();
        this.renderTasks();
    },

    deleteTask(id) {
        if (confirm('Jesi siguran da želiš obrisati ovu obvezu?')) {
            TaskManager.deleteTask(id);
            this.updateMonthlyOverview();
            this.renderTasks();
        }
    }
};

// ==========================================
// Inicijalizacija aplikacije
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    TaskManager.init();
    UIRenderer.init();
});