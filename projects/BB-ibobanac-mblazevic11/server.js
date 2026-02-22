// server.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Servira HTML, CSS, JS fajlove

// ==========================================
// SUPABASE INICIJALIZACIJA (SA SERVICE KEY)
// ==========================================
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ==========================================
// 1. RUTA ZA AI CHAT (ZAMJENA ZA GEMINI API)
// ==========================================
app.post('/api/chat', async (req, res) => {
  try {
    const { text, userId, tasks } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Ti si asistent u aplikaciji Student Planner. Odgovori isključivo na hrvatskom jeziku. 
              Korisnik ima ${tasks?.length || 0} obveza. 
              Ako te pita o obvezama, možeš mu dati savjete o organizaciji vremena.
              Pitanje: ${text}`
            }]
          }]
        })
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 2. RUTA ZA LOGIN (SIGURNA AUTENTIFIKACIJA)
// ==========================================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Vrati JWT token frontendu
    res.json({ 
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 3. RUTA ZA REGISTRACIJU
// ==========================================
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Registracija uspješna! Možeš se prijaviti.',
      userId: data.user?.id 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==========================================
// 4. RUTA ZA DOBIVANJE TASKOVA
// ==========================================
app.get('/api/tasks', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Kreiraj Supabase klijent s userovim tokenom
    const supabaseUser = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Dohvati usera iz tokena
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Dohvati taskove za tog usera
    const { data: tasks, error: tasksError } = await supabaseUser
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);

    if (tasksError) throw tasksError;

    res.json({ tasks });
  } catch (error) {
    console.error('Tasks API error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// 5. RUTA ZA DODAVANJE TASKA
// ==========================================
app.post('/api/tasks', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { title, date, category } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const supabaseUser = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    
    const { data, error } = await supabaseUser
      .from('tasks')
      .insert([{ 
        title, 
        due_date: date, 
        category,
        user_id: user.id 
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ task: data });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// START SERVERA
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Backend server running at http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${__dirname}`);
});