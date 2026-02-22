// ==========================================
// KONSTANTE I KONFIGURACIJA
// ==========================================
const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;
let supabaseClient = null;

// ==========================================
// AUTH MANAGER - BEZ KLJUČEVA
// ==========================================
async function initSupabase(token) {
    const { createClient } = window.supabase;
    supabaseClient = createClient(
        "https://xthctnoltatqqjgfnhgr.supabase.co",
        "sb_publishable_LLRtIH034uv71OnaHUhJqw_vqYHFmpf",
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        }
    );
    return supabaseClient;
}

async function checkAuth() {
    const token = localStorage.getItem('student_planner_token');
    
    if (!token) {
        window.location.href = 'auth.html';
        return null;
    }
    
    await initSupabase(token);
    
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error || !user) {
        localStorage.removeItem('student_planner_token');
        localStorage.removeItem('student_planner_user');
        window.location.href = 'auth.html';
        return null;
    }
    
    currentUser = user;
    
    const savedUser = localStorage.getItem('student_planner_user');
    if (savedUser) {
        currentUser = { ...user, ...JSON.parse(savedUser) };
    }
    
    return currentUser;
}

async function logout() {
    localStorage.removeItem('student_planner_token');
    localStorage.removeItem('student_planner_user');
    window.location.href = 'auth.html';
}

// ==========================================
// THEME MANAGER
// ==========================================
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });
    },

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const icon = document.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    },

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
};

// ==========================================
// TASK MANAGER - KORISTI BACKEND API
// ==========================================
const TaskManager = {
    tasks: [],

    async init() {
        const token = localStorage.getItem('student_planner_token');
        
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const data = await response.json();
            this.tasks = data.tasks?.map(t => ({
                id: t.id,
                title: t.title,
                date: t.due_date,
                category: t.category,
                completed: t.completed
            })) || [];
        } catch (error) {
            console.error("Greška kod učitavanja:", error);
            this.tasks = [];
        }
    },

    async addTask(title, date, category) {
        const token = localStorage.getItem('student_planner_token');
        
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, date, category })
            });

            if (!response.ok) {
                throw new Error('Failed to add task');
            }

            const data = await response.json();
            
            this.tasks.push({
                id: data.task.id,
                title: data.task.title,
                date: data.task.due_date,
                category: data.task.category,
                completed: data.task.completed
            });
            
            return true;
        } catch (error) {
            console.error("Greška kod dodavanja:", error);
            return false;
        }
    },

    async deleteTask(id) {
        const token = localStorage.getItem('student_planner_token');
        
        try {
            await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            this.tasks = this.tasks.filter(t => t.id !== id);
            return true;
        } catch (error) {
            console.error("Greška kod brisanja:", error);
            return false;
        }
    },

    async toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return false;

        const newValue = !task.completed;
        const token = localStorage.getItem('student_planner_token');
        
        try {
            await fetch(`${API_BASE_URL}/tasks/${id}/complete`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed: newValue })
            });

            task.completed = newValue;
            return true;
        } catch (error) {
            console.error("Greška kod ažuriranja:", error);
            return false;
        }
    },

    getTasks(filter='all') {
        if(filter==='all') return this.tasks;
        if(filter==='active') return this.tasks.filter(t=>!t.completed);
        if(filter==='completed') return this.tasks.filter(t=>t.completed);
        return this.tasks.filter(t=>t.category===filter);
    },

    getMonthlyStats() {
        const now = new Date(); now.setHours(0,0,0,0);
        const in7 = new Date(now.getTime()+7*24*60*60*1000);

        const total = this.tasks.length;
        const pending = this.tasks.filter(t=>!t.completed).length;
        const completed = this.tasks.filter(t=>t.completed).length;
        const upcoming = this.tasks.filter(t=>{
            const d = UIRenderer.parseDate(t.date);
            return !t.completed && d>=now && d<=in7;
        }).length;

        return { total, pending, completed, upcoming };
    }
};

// ==========================================
// UI RENDERER
// ==========================================
const UIRenderer = {
    currentFilter: 'all',

    parseDate(s){
        const [y,m,d]=s.split('-').map(Number);
        const dt=new Date(y,m-1,d);
        dt.setHours(0,0,0,0);
        return dt;
    },

    async init(){
        const user = await checkAuth();
        if (!user) return;

        await TaskManager.init();
        this.showUserInfo(user);
        this.updateMonthlyOverview();
        this.renderTasks();
        this.setupEventListeners();
    },

    showUserInfo(user) {
        const header = document.querySelector('header');
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        userInfo.innerHTML = `
            <span>👤 ${user.user_metadata?.full_name || user.email}</span>
            <button id="logout-btn" class="logout-btn">Odjava</button>
        `;
        header.appendChild(userInfo);

        document.getElementById('logout-btn').addEventListener('click', logout);
    },

    updateMonthlyOverview(){
        const months=['Siječanj','Veljača','Ožujak','Travanj','Svibanj','Lipanj','Srpanj','Kolovoz','Rujan','Listopad','Studeni','Prosinac'];
        const now=new Date();
        const month=months[now.getMonth()];
        const year=now.getFullYear();

        document.getElementById('current-month').textContent=`${month} ${year}`;

        const stats=TaskManager.getMonthlyStats();
        document.getElementById('total-tasks').textContent=stats.total;
        document.getElementById('pending-tasks').textContent=stats.pending;
        document.getElementById('completed-tasks').textContent=stats.completed;
        document.getElementById('upcoming-tasks').textContent=stats.upcoming;
    },

    renderTasks(){
        const tasksList=document.getElementById('tasks-list');
        const tasks=TaskManager.getTasks(this.currentFilter);

        if(!tasks.length){
            tasksList.innerHTML=`<div class="empty-state"><div class="empty-state-icon">📝</div><p>Nema obveza u ovoj kategoriji.</p></div>`;
            return;
        }

        tasks.sort((a,b)=>this.parseDate(a.date)-this.parseDate(b.date));

        tasksList.innerHTML=tasks.map(t=>`
            <div class="task-item ${t.completed?'completed':''}" data-id="${t.id}">
                <div class="task-info">
                    <div class="task-title">${t.title}</div>
                    <div class="task-meta">
                        <span class="task-date">📅 ${this.parseDate(t.date).toLocaleDateString('hr-HR',{day:'numeric',month:'long',year:'numeric'})}</span>
                        <span class="task-category category-${t.category.toLowerCase()}">${t.category}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn complete-btn">${t.completed?'↩️':'✓'}</button>
                    <button class="action-btn delete-btn">✕</button>
                </div>
            </div>
        `).join('');
    },

    setupEventListeners(){
        // Dodavanje obveze kroz formu
        document.getElementById('task-form').addEventListener('submit', async e=>{
            e.preventDefault();

            const success = await TaskManager.addTask(
                document.getElementById('task-title').value,
                document.getElementById('task-date').value,
                document.getElementById('task-category').value
            );

            if (success) {
                this.updateMonthlyOverview();
                this.renderTasks();
                e.target.reset();
            } else {
                alert('Greška pri dodavanju obveze!');
            }
        });

        // Filteri
        document.querySelectorAll('.filter-btn').forEach(btn =>
            btn.addEventListener('click', ()=>{
                document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter=btn.dataset.filter;
                this.renderTasks();
            })
        );

        // Task akcije
        document.getElementById('tasks-list').addEventListener('click', async e=>{
            const task=e.target.closest('.task-item');
            if(!task) return;

            const id=task.dataset.id;

            if(e.target.closest('.complete-btn')){
                await TaskManager.toggleComplete(id);
                this.updateMonthlyOverview();
                this.renderTasks();
            } else if(e.target.closest('.delete-btn')){
                if(confirm('Jesi siguran da želiš obrisati ovu obvezu?')){
                    await TaskManager.deleteTask(id);
                    this.updateMonthlyOverview();
                    this.renderTasks();
                }
            }
        });
    }
};

// ==========================================
// QUICK ADD
// ==========================================
const QuickAdd = {
    init() {
        document.getElementById('quick-add-btn')?.addEventListener('click', () => this.handleQuickAdd());
        document.getElementById('quick-add-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleQuickAdd();
        });
    },

    async handleQuickAdd() {
        const input = document.getElementById('quick-add-input');
        const text = input.value.trim();
        
        if (!text) return;

        const parsed = this.parseQuickInput(text);
        
        if (!parsed) {
            alert('❌ Ne mogu razumjeti unos. Pokušaj npr: "Ispit Matematika 15.3." ili "15.3. Projekt"');
            return;
        }

        const success = await TaskManager.addTask(parsed.title, parsed.date, parsed.category);
        
        if (success) {
            UIRenderer.updateMonthlyOverview();
            UIRenderer.renderTasks();
            input.value = '';
            
            const feedback = document.createElement('div');
            feedback.className = 'quick-add-feedback';
            feedback.innerHTML = `✅ Dodano: ${parsed.title} (${parsed.date})`;
            input.parentElement.appendChild(feedback);
            
            setTimeout(() => feedback.remove(), 3000);
        } else {
            alert('Greška pri dodavanju obveze!');
        }
    },

    parseQuickInput(text) {
        const dateRegex = /(\d{1,2})[\.\-\/](\d{1,2})\.?/;
        const dateMatch = text.match(dateRegex);
        
        if (!dateMatch) return null;

        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]);
        const year = new Date().getFullYear();
        
        if (day < 1 || day > 31 || month < 1 || month > 12) return null;

        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        let title = text.replace(dateRegex, '').trim();

        let category = 'Osobno';
        const keywords = {
            'Ispit': ['ispit', 'kolokvij', 'test', 'provjera'],
            'Projekt': ['projekt', 'seminar', 'rad', 'prezentacija', 'višok'],
            'Zadaca': ['zadaća', 'zadaca', 'domaća', 'domaca', 'vježba', 'vjezba', 'hw']
        };

        const lowerText = text.toLowerCase();
        for (const [cat, words] of Object.entries(keywords)) {
            if (words.some(word => lowerText.includes(word))) {
                category = cat;
                break;
            }
        }

        keywords[category]?.forEach(word => {
            const regex = new RegExp(word, 'gi');
            title = title.replace(regex, '').trim();
        });

        title = title.replace(/hitno/gi, '').trim();

        if (!title) {
            title = category;
        }

        return { title, date, category };
    }
};

// ==========================================
// POMODORO TIMER
// ==========================================
const PomodoroTimer = {
    workDuration: 25 * 60,
    breakDuration: 5 * 60,
    currentTime: 25 * 60,
    isRunning: false,
    isWorkMode: true,
    timerInterval: null,

    init() {
        document.getElementById('start-btn')?.addEventListener('click', () => this.start());
        document.getElementById('pause-btn')?.addEventListener('click', () => this.pause());
        document.getElementById('reset-btn')?.addEventListener('click', () => this.reset());
        
        document.getElementById('work-duration')?.addEventListener('change', (e) => {
            this.workDuration = parseInt(e.target.value) * 60;
            if (this.isWorkMode && !this.isRunning) {
                this.currentTime = this.workDuration;
                this.updateDisplay();
            }
        });

        document.getElementById('break-duration')?.addEventListener('change', (e) => {
            this.breakDuration = parseInt(e.target.value) * 60;
            if (!this.isWorkMode && !this.isRunning) {
                this.currentTime = this.breakDuration;
                this.updateDisplay();
            }
        });

        this.updateDisplay();
    },

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.updateStatus();
        
        this.timerInterval = setInterval(() => {
            this.currentTime--;
            this.updateDisplay();

            if (this.currentTime <= 0) {
                this.onTimerComplete();
            }
        }, 1000);
    },

    pause() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.updateStatus();
    },

    reset() {
        this.pause();
        this.isWorkMode = true;
        this.currentTime = this.workDuration;
        this.updateDisplay();
        this.updateStatus();
    },

    onTimerComplete() {
        this.pause();
        
        if (this.isWorkMode) {
            alert('🎉 Vrijeme za pauzu! Odmaraj se 5 minuta.');
            this.isWorkMode = false;
            this.currentTime = this.breakDuration;
        } else {
            alert('💪 Pauza gotova! Nastavi raditi.');
            this.isWorkMode = true;
            this.currentTime = this.workDuration;
        }
        
        this.updateDisplay();
        this.updateStatus();
    },

    updateDisplay() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const displayEl = document.getElementById('timer-display');
        if (displayEl) {
            displayEl.textContent = display;
        }
    },

    updateStatus() {
        const statusEl = document.getElementById('timer-status');
        if (!statusEl) return;

        if (this.isRunning) {
            statusEl.textContent = this.isWorkMode ? '🔥 Radim...' : '☕ Pauza u tijeku...';
        } else {
            statusEl.textContent = this.isWorkMode ? 'Spreman za rad 💪' : 'Spreman za pauzu ☕';
        }
    }
};

// ==========================================
// AI CHATBOT - KORISTI BACKEND
// ==========================================
const ChatBot = {
    init() {
        document.getElementById('chat-toggle-btn')?.addEventListener('click', () => {
            document.getElementById('chat-window').classList.toggle('open');
        });
        
        document.getElementById('close-chat')?.addEventListener('click', () => {
            document.getElementById('chat-window').classList.remove('open');
        });
        
        document.getElementById('send-msg-btn')?.addEventListener('click', () => this.handleSend());
        
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
    },

    addMsg(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        div.innerHTML = text.replace(/\n/g, '<br>');
        const container = document.getElementById('chat-messages');
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    async handleSend() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        
        if (!text) return;
        
        this.addMsg(text, 'user');
        input.value = '';

        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'message bot-message';
        loader.textContent = 'AI razmišlja...';
        document.getElementById('chat-messages').appendChild(loader);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: text,
                    userId: currentUser?.id,
                    tasks: TaskManager.tasks 
                })
            });

            const data = await response.json();
            loader.remove();

            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                this.addMsg(data.candidates[0].content.parts[0].text, 'bot');
            } else if (data.error) {
                console.error("Chat API error:", data.error);
                this.addMsg("Greška u AI servisu: " + (data.error.message || "Nepoznata greška"), 'bot');
            } else {
                this.addMsg("Nepoznat odgovor AI servisa.", 'bot');
            }
        } catch (error) {
            loader.remove();
            console.error("Chatbot network error:", error);
            this.addMsg("⚠️ Chatbot trenutno nije dostupan. Provjeri da li je backend server pokrenut.", 'bot');
        }
    }
};

// ==========================================
// INICIJALIZACIJA APLIKACIJE
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    ThemeManager.init();
    await UIRenderer.init();
    QuickAdd.init();
    PomodoroTimer.init();
    ChatBot.init();
    
    // Postavi današnji datum kao default u formi
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-date').value = today;
    document.getElementById('task-date').min = today;
});