// register.js
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (response.ok) {
      alert('Registrierung erfolgreich!');
      window.location.href = 'index.html';
    } else {
      // HTTP 400 oder andere Fehler
      const errText = await response.text();
      alert(errText || `Fehler bei der Registrierung (${response.status})`);
    }
  } catch (err) {
    console.error('Fehler:', err);
    alert('Serverfehler bei der Registrierung.');
  }
});
