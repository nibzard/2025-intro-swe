// ==========================================
// KONSTANTE
// ==========================================
const API_BASE_URL = 'http://localhost:3000/api';

// ==========================================
// AUTH MANAGER - BEZ DIREKTNIH SUPABASE KLJUČEVA
// ==========================================
const AuthManager = {
    // PRIJAVA - koristi backend API
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Spremi token i user info u localStorage
            localStorage.setItem('student_planner_token', data.token);
            localStorage.setItem('student_planner_user', JSON.stringify(data.user));
            
            // Uspješna prijava - preusmjeri na glavni planner
            window.location.href = 'index.html';
        } catch (error) {
            this.showError('login-error', this.getErrorMessage(error));
        }
    },

    // REGISTRACIJA - koristi backend API
    async register(email, password, name) {
        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            alert(data.message || 'Registracija uspješna! Možeš se prijaviti.');
            this.switchToLogin();
        } catch (error) {
            this.showError('register-error', this.getErrorMessage(error));
        }
    },

    // Prikaži grešku
    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        errorEl.textContent = message;
        errorEl.classList.add('show');
        
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, 5000);
    },

    // Pretvori error u hrvatski
    getErrorMessage(error) {
        const messages = {
            'Invalid login credentials': 'Pogrešan email ili lozinka',
            'Email not confirmed': 'Email nije potvrđen',
            'User already registered': 'Korisnik s tim emailom već postoji',
            'Password should be at least 6 characters': 'Lozinka mora imati najmanje 6 znakova',
            'Failed to fetch': 'Greška u vezi s serverom',
            'Network Error': 'Nema veze s serverom'
        };

        return messages[error.message] || 'Greška: ' + error.message;
    },

    // Prebaci na login formu
    switchToLogin() {
        document.getElementById('login-form').classList.add('active');
        document.getElementById('register-form').classList.remove('active');
        this.clearFormErrors();
    },

    // Prebaci na register formu
    switchToRegister() {
        document.getElementById('register-form').classList.add('active');
        document.getElementById('login-form').classList.remove('active');
        this.clearFormErrors();
    },

    // Očisti greške s formi
    clearFormErrors() {
        document.getElementById('login-error').textContent = '';
        document.getElementById('register-error').textContent = '';
    }
};

// ==========================================
// EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Provjeri da li je korisnik već prijavljen
    const token = localStorage.getItem('student_planner_token');
    if (token) {
        window.location.href = 'index.html';
        return;
    }

    // Prijava forma
    document.getElementById('login').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        await AuthManager.login(email, password);
    });

    // Registracija forma
    document.getElementById('register').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        if (password !== confirm) {
            AuthManager.showError('register-error', 'Lozinke se ne poklapaju!');
            return;
        }

        if (password.length < 6) {
            AuthManager.showError('register-error', 'Lozinka mora imati najmanje 6 znakova');
            return;
        }

        await AuthManager.register(email, password, name);
    });

    // Prebacivanje između formi
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        AuthManager.switchToRegister();
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        AuthManager.switchToLogin();
    });

    // Auto-focus na prvo polje
    if (document.getElementById('login-form').classList.contains('active')) {
        document.getElementById('login-email').focus();
    } else {
        document.getElementById('register-name').focus();
    }
});