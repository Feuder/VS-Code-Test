import { checkLoginStatus, apiFetch, logout } from './Einlog.js';

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    // Ersetze fetch-Aufruf
    apiFetch('/items')
      .then(items => { /* ...existing code... */ })
      .catch(err => console.error(err));
    
    // Falls ein Logout-Button existiert
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }
});