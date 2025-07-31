const API_BASE = 'http://localhost:5000/api/auth';

// Register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();
    const alert = document.getElementById('registerAlert');

    if (res.ok) {
      alert.textContent = data.message;
      alert.style.color = 'green';
      setTimeout(() => window.location.href = 'login.html', 2000);
    } else {
      alert.textContent = data.message || 'Registration failed';
      alert.style.color = 'red';
    }
  });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    const alert = document.getElementById('loginAlert');

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alert.textContent = 'Login successful!';
      alert.style.color = 'green';

      setTimeout(() => {
        const role = data.user.role;
        if (role === 'donor') window.location.href = 'donorDashboard.html';
        else if (role === 'recipient') window.location.href = 'recipientDashboard.html';
        else window.location.href = 'adminDashboard.html';
      }, 1500);
    } else {
      alert.textContent = data.message || 'Login failed';
      alert.style.color = 'red';
    }
  });
}
