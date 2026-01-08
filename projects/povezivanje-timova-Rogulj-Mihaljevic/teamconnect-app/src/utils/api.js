// API helper sa automatskim refresh tokenom

const API_URL = 'http://localhost:5000/api';

// Helper za dohvat tokena
const getAccessToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken');

const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Refresh access token
const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearTokens();
    window.location.href = '/login';
    throw error;
  }
};

// Main API call funkcija
export const apiCall = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  // Dodaj token u header
  const accessToken = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers
    });

    // Ako je 401, pokušaj refresh token
    if (response.status === 401 && getRefreshToken()) {
      console.log('🔄 Token expired, refreshing...');
      
      const newAccessToken = await refreshAccessToken();
      
      // Ponovi original request sa novim tokenom
      headers['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(url, {
        ...options,
        headers
      });
    }

    // Ako i dalje nije OK
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API call failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Helper funkcije za česte operacije
export const api = {
  get: (endpoint, options = {}) => 
    apiCall(endpoint, { method: 'GET', ...options }),
  
  post: (endpoint, data, options = {}) => 
    apiCall(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data),
      ...options 
    }),
  
  put: (endpoint, data, options = {}) => 
    apiCall(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data),
      ...options 
    }),
  
  delete: (endpoint, options = {}) => 
    apiCall(endpoint, { method: 'DELETE', ...options }),
};

export default api;