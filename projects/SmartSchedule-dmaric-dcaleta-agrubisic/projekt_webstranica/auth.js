// Lightweight client-side auth helper for SmartSchedule
// NOTE: This is localStorage-based demo auth. For production, use a proper backend.

async function sha256Hex(str) {
    const enc = new TextEncoder();
    const data = enc.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
    try { return JSON.parse(localStorage.getItem('ss_users') || '[]'); }
    catch(e){ return []; }
}

function saveUsers(users) {
    localStorage.setItem('ss_users', JSON.stringify(users));
}

function findUserByName(name) {
    const users = getUsers();
    return users.find(u => u.name === name) || null;
}

function findUserById(id) {
    const users = getUsers();
    return users.find(u => u.id === id) || null;
}

async function registerUser({name, password, isBoss=false, company=null}){
    name = (name||'').trim();
    if (!name || !password) throw new Error('Ime i lozinka su obavezni');

    if (findUserByName(name)) throw new Error('Korisničko ime već postoji');

    // Simple client-side salt: use username
    const passHash = await sha256Hex(password + ':' + name);

    const user = {
        id: 'u' + Date.now() + Math.floor(Math.random()*9999),
        name,
        passHash,
        isBoss: !!isBoss,
        company: isBoss && company ? company : null,
        createdAt: Date.now()
    };

    const users = getUsers();
    users.push(user);
    saveUsers(users);

    // set session
    localStorage.setItem('ss_session', user.id);

    return user;
}

async function loginUser({name, password}){
    name = (name||'').trim();
    if (!name || !password) throw new Error('Ime i lozinka su obavezni');

    const user = findUserByName(name);
    if (!user) throw new Error('Korisnik ne postoji');

    const passHash = await sha256Hex(password + ':' + name);
    if (passHash !== user.passHash) throw new Error('Neispravna lozinka');

    localStorage.setItem('ss_session', user.id);
    return user;
}

function logout() {
    localStorage.removeItem('ss_session');
}

function getCurrentUser() {
    const id = localStorage.getItem('ss_session');
    if (!id) return null;
    return findUserById(id);
}

function requireAuth(redirectTo='index.html'){
    const u = getCurrentUser();
    if (!u) location.href = redirectTo;
    return u;
}

function updateCompanySettings(userId, settings){
    const users = getUsers();
    const idx = users.findIndex(u=>u.id === userId);
    if (idx === -1) throw new Error('Korisnik ne postoji');
    users[idx].company = users[idx].company || {};
    users[idx].company.settings = settings;
    saveUsers(users);
    return users[idx].company.settings;
}

function getCompanySettings(userId){
    const u = findUserById(userId);
    return (u && u.company && u.company.settings) ? u.company.settings : null;
}

// expose
window.ssAuth = {
    sha256Hex,
    getUsers,
    saveUsers,
    registerUser,
    loginUser,
    logout,
    getCurrentUser,
    requireAuth,
    updateCompanySettings,
    getCompanySettings
};
