// API Configuration
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_URL = isLocalhost
  ? 'http://localhost:5000'
  : 'https://backend-rose-eight-87.vercel.app';

export default API_URL;
