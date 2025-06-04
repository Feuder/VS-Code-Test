// login.js
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    if (!username || !password) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
  
      if (response.ok) {
        // erfolgreich, JSON mit Token
        const data = await response.json();
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';
      } else {
        // Fehler: body als Text auslesen, weil es kein JSON ist
        const errText = await response.text();
        alert(errText || `Login fehlgeschlagen (${response.status})`);
      }
    } catch (error) {
      console.error('Fehler beim Login:', error);
      alert('Netzwerkfehler beim Login.');
    }
  }
  
  const loginButton = document.getElementById('loginButton');
  if (loginButton) loginButton.addEventListener('click', login);
  