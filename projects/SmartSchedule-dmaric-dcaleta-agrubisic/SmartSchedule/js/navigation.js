// navigation.js - Zabrana ilegalne navigacije

// Provjera pristupa na svakoj stranici
window.addEventListener('DOMContentLoaded', function() {
  const session = sessionStorage.getItem('sessionUser');
  const path = window.location.pathname;
  if (!session && path.indexOf('index.html') === -1) {
    window.location.href = 'index.html';
    return;
  }
  if (session) {
    const user = JSON.parse(session);
    // Ako je na index.html (login/registracija) i prijavljen je, preusmjeri na dashboard
    if (path.indexOf('index.html') !== -1) {
      window.location.href = 'dashboard.html';
      return;
    }
    // Poslodavac može svugdje, radnik ne može na business stranice
    if (user.role === 'worker') {
      if (path.indexOf('business') !== -1) {
        window.location.href = 'dashboard.html';
        return;
      }
    }
    // Ako je poslodavac, ne može na personal.html
    if (user.role === 'boss' && path.indexOf('personal.html') !== -1) {
      window.location.href = 'dashboard.html';
      return;
    }
  }
});
