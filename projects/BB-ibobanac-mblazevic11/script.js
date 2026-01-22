// ==========================================
// SUPABASE INIT
// ==========================================
const supabaseUrl = "https://xthctnoltatqqjgfnhgr.supabase.co";
const supabaseKey = "sb_publishable_LLRtIH034uv71OnaHUhJqw_vqYHFmpf";

const supabaseClient = supabase.createClient(
  supabaseUrl,
  supabaseKey
);

// ==========================================
// MODUL B - Task Manager (SUPABASE)
// ==========================================
const TaskManager = {
    tasks: [],

    async init() {
        const { data, error } = await supabaseClient
            .from("tasks")
            .select("*");

        if (error) {
            console.error("Greška kod učitavanja:", error);
            this.tasks = [];
        } else {
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
        const { data, error } = await supabaseClient
            .from("tasks")
            .insert([{ title, due_date: date, category }])
            .select()
            .single();

        if (error) {
            console.error("Greška kod dodavanja:", error);
            return;
        }

        this.tasks.push({
            id: data.id,
            title: data.title,
            date: data.due_date,
            category: data.category,
            completed: data.completed
        });
    },

    async deleteTask(id) {
        await supabaseClient.from("tasks").delete().eq("id", id);
        this.tasks = this.tasks.filter(t => t.id !== id);
    },

    async toggleComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newValue = !task.completed;

        await supabaseClient
            .from("tasks")
            .update({ completed: newValue })
            .eq("id", id);

        task.completed = newValue;
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
// MODUL C - UI Renderer
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
        await TaskManager.init();
        this.updateMonthlyOverview();
        this.renderTasks();
        this.setupEventListeners();
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
        document.getElementById('task-form').addEventListener('submit', async e=>{
            e.preventDefault();

            await TaskManager.addTask(
                document.getElementById('task-title').value,
                document.getElementById('task-date').value,
                document.getElementById('task-category').value
            );

            this.updateMonthlyOverview();
            this.renderTasks();
            e.target.reset();
        });

        document.querySelectorAll('.filter-btn').forEach(btn =>
            btn.addEventListener('click', ()=>{
                document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter=btn.dataset.filter;
                this.renderTasks();
            })
        );

        document.getElementById('tasks-list').addEventListener('click', async e=>{
            const task=e.target.closest('.task-item');
            if(!task) return;

            const id=task.dataset.id;

            if(e.target.closest('.complete-btn')){
                await TaskManager.toggleComplete(id);
            } else if(e.target.closest('.delete-btn')){
                if(confirm('Jesi siguran da želiš obrisati ovu obvezu?')){
                    await TaskManager.deleteTask(id);
                }
            }

            this.updateMonthlyOverview();
            this.renderTasks();
        });
    }
};

// ==========================================
// INIT APP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    UIRenderer.init();
});
