// ==========================================
// SUPABASE INIT
// ==========================================
const supabaseUrl = "https://xthctnoltatqqjgfnhgr.supabase.co";
const supabaseKey = "sb_publishable_LLRtIH034uv71OnaHUhJqw_vqYHFmpf";

let supabaseClient;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
}

// ==========================================
// TASK MANAGER & UI RENDERER
// ==========================================
const TaskManager = {
    tasks: [],
    async init() {
        if (!supabaseClient) return;
        const { data, error } = await supabaseClient.from("tasks").select("*");
        if (!error) {
            this.tasks = data.map(t => ({
                id: t.id,
                title: t.title,
                date: t.due_date,
                category: t.category,
                completed: t.completed
            }));
        }
    },
    async addTask(title, date, category) {
        const { data, error } = await supabaseClient.from("tasks").insert([{ title, due_date: date, category }]).select().single();
        if (!error) this.tasks.push({ id: data.id, title: data.title, date: data.due_date, category: data.category, completed: data.completed });
    },
    async deleteTask(id) {
        await supabaseClient.from("tasks").delete().eq("id", id);
        this.tasks = this.tasks.filter(t => t.id !== id);
    },
    async toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        const newValue = !task.completed;
        await supabaseClient.from("tasks").update({ completed: newValue }).eq("id", id);
        task.completed = newValue;
    },
    getTasks(f='all') {
        if(f==='all') return this.tasks;
        if(f==='active') return this.tasks.filter(t=>!t.completed);
        if(f==='completed') return this.tasks.filter(t=>t.completed);
        return this.tasks.filter(t=>t.category===f);
    },
    getMonthlyStats() {
        return { 
            total: this.tasks.length, 
            pending: this.tasks.filter(t=>!t.completed).length, 
            completed: this.tasks.filter(t=>t.completed).length 
        };
    }
};

const UIRenderer = {
    currentFilter: 'all',
    parseDate(s){ if(!s) return new Date(); const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); },
    async init(){ await TaskManager.init(); this.updateStats(); this.render(); this.events(); },
    updateStats(){
        const stats = TaskManager.getMonthlyStats();
        if(document.getElementById('total-tasks')) document.getElementById('total-tasks').textContent=stats.total;
        if(document.getElementById('pending-tasks')) document.getElementById('pending-tasks').textContent=stats.pending;
        if(document.getElementById('completed-tasks')) document.getElementById('completed-tasks').textContent=stats.completed;
    },
    render(){
        const list=document.getElementById('tasks-list');
        if(!list) return;
        const tasks=TaskManager.getTasks(this.currentFilter);
        list.innerHTML=tasks.map(t=>`
            <div class="task-item ${t.completed?'completed':''}" data-id="${t.id}">
                <div class="task-info"><div>${t.title}</div><small>${t.date} | ${t.category}</small></div>
                <div class="task-actions"><button class="complete-btn">✓</button><button class="delete-btn">✕</button></div>
            </div>
        `).join('');
    },
    events(){
        document.getElementById('task-form')?.addEventListener('submit', async e=>{
            e.preventDefault();
            await TaskManager.addTask(document.getElementById('task-title').value, document.getElementById('task-date').value, document.getElementById('task-category').value);
            this.updateStats(); this.render(); e.target.reset();
        });
        document.getElementById('tasks-list')?.addEventListener('click', async e=>{
            const id=e.target.closest('.task-item')?.dataset.id;
            if(e.target.classList.contains('complete-btn')) await TaskManager.toggleComplete(id);
            if(e.target.classList.contains('delete-btn')) await TaskManager.deleteTask(id);
            this.updateStats(); this.render();
        });
    }
};

// ==========================================
// CHATBOT (poziva backend API, GEMINI ključ na serveru)
// ==========================================
const ChatBot = {
    init() {
        document.getElementById('chat-toggle-btn')?.addEventListener('click', () => document.getElementById('chat-window').classList.toggle('open'));
        document.getElementById('close-chat')?.addEventListener('click', () => document.getElementById('chat-window').classList.remove('open'));
        document.getElementById('send-msg-btn')?.addEventListener('click', () => this.handleSend());
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => { if(e.key==='Enter') this.handleSend(); });
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
        if(!text) return;
        this.addMsg(text, 'user');
        input.value = '';

        const loader = document.createElement('div');
        loader.id = 'loader'; loader.className = 'message bot-message'; loader.textContent = '...';
        document.getElementById('chat-messages').appendChild(loader);

        try {
            const res = await fetch('/api/chat', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text })
            });

            const data = await res.json();
            loader.remove();

            if(data.candidates?.[0]?.content?.parts?.[0]?.text) {
                this.addMsg(data.candidates[0].content.parts[0].text, 'bot');
            } else if(data.error) {
                this.addMsg("Greška u API‑ju: " + data.error.message, 'bot');
            } else {
                this.addMsg("Nepoznat odgovor API‑ja.", 'bot');
            }
        } catch (e) {
            loader.remove();
            this.addMsg("Pogreška mreže ili internet.", 'bot');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UIRenderer.init();
    ChatBot.init();
});

