// auth.js - Login, registracija, role, session

// Helper: dohvati korisnike iz LocalStorage
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

// Helper: spremi korisnike
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Helper: spremi session
function setSession(user) {
  sessionStorage.setItem('sessionUser', JSON.stringify(user));
}

// Helper: dohvati session
function getSession() {
  return JSON.parse(sessionStorage.getItem('sessionUser'));
}

// Helper: odjava
function logout() {
  sessionStorage.removeItem('sessionUser');
  window.location.href = 'index.html';
}

// Prikaži/sakrij polja tvrtke ovisno o odabranoj ulozi
function toggleCompanyFields() {
  const role = document.getElementById('regRole').value;
  const companyFieldsContainer = document.getElementById('companyFieldsContainer');
  const companyNameInput = document.getElementById('regCompanyName');
  const companyOIBInput = document.getElementById('regCompanyOIB');
  
  if (role === 'boss') {
    companyFieldsContainer.style.display = 'block';
    companyNameInput.required = true;
    companyOIBInput.required = true;
  } else {
    companyFieldsContainer.style.display = 'none';
    companyNameInput.required = false;
    companyOIBInput.required = false;
  }
}

// Prijava
function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    // Ako nema ID, dodaj ga
    if (!user.id) {
      user.id = window.randomId ? window.randomId() : Math.floor(100 + Math.random() * 900);
      saveUsers(users);
    }
    setSession(user);
    window.location.href = 'dashboard.html';
  } else {
    alert('Neispravni podaci.');
  }
}

// Registracija
function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  let users = getUsers();
  if (users.find(u => u.username === username)) {
    alert('Korisničko ime zauzeto.');
    return;
  }
  // Dodaj jedinstveni ID
  const id = window.randomId ? window.randomId() : Math.floor(100 + Math.random() * 900);
  const user = { username, password, role, isBoss: role === 'boss', id };
  
  // Ako je poslodavac, spremi podatke tvrtke
  if (role === 'boss') {
    const companyName = document.getElementById('regCompanyName').value.trim();
    const companyOIB = document.getElementById('regCompanyOIB').value.trim();
    if (!companyName || !companyOIB) {
      alert('Molimo popunite sve podatke tvrtke.');
      return;
    }
    user.companyName = companyName;
    user.companyOIB = companyOIB;
  }
  
  users.push(user);
  saveUsers(users);
  alert('Registracija uspješna! Prijavite se.');
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
  document.querySelectorAll('.switch-auth')[0].style.display = 'flex';
  document.querySelectorAll('.switch-auth')[1].style.display = 'none';
}

// UI switch login/register
window.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const regRole = document.getElementById('regRole');
  
  if (loginForm) loginForm.onsubmit = handleLogin;
  if (registerForm) registerForm.onsubmit = handleRegister;
  
  // Inicijalizuj vidljivost polja tvrtke
  if (regRole) {
    regRole.addEventListener('change', toggleCompanyFields);
    toggleCompanyFields(); // Pozovi na početku
  }
  
  if (showRegister) showRegister.onclick = function() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    document.querySelectorAll('.switch-auth')[0].style.display = 'none';
    document.querySelectorAll('.switch-auth')[1].style.display = 'flex';
  };
  if (showLogin) showLogin.onclick = function() {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    document.querySelectorAll('.switch-auth')[0].style.display = 'flex';
    document.querySelectorAll('.switch-auth')[1].style.display = 'none';
  };
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.onclick = logout;
});
