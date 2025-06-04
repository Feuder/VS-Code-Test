import { checkLoginStatus, apiFetch, logout } from './Einlog.js';
const BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    apiFetch('/items')
        .then(items => {
            const objectCountElement = document.getElementById('objectCount');
            const count = Array.isArray(items) ? items.length : 0;

            if (objectCountElement) {
                objectCountElement.textContent = `${count}`;
            } else {
                console.error("Element mit ID 'objectCount' nicht gefunden!");
            }
        })
        .catch(err => {
            console.error('Fehler beim Abrufen der Objekte:', err.message);
            const objectCountElement = document.getElementById('objectCount');
            if (objectCountElement) {
                objectCountElement.textContent = 'Fehler';
            }
        });

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});

function showHW() {
    window.location.href = 'hw.html';
}

function showSTATI() {
    window.location.href = 'Statistiken.HTML';
}

window.showSTATI = showSTATI;
window.showHW    = showHW;