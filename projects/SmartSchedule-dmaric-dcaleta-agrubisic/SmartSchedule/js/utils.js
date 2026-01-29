// utils.js - Helper funkcije

// Generiraj random ID
function randomId() {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Deep copy
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
