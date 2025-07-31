document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const alertDiv = document.getElementById('loginAlert');

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      alertDiv.className = 'alert success';
      alertDiv.textContent = 'Login successful';

      if (data.user.role === 'donor') window.location.href = 'donorDashboard.html';
      else if (data.user.role === 'recipient') window.location.href = 'recipientDashboard.html';
      else if (data.user.role === 'admin') window.location.href = 'adminDashboard.html';
    } else {
      alertDiv.className = 'alert error';
      alertDiv.textContent = data.message || 'Login failed';
    }
  } catch (err) {
    alertDiv.className = 'alert error';
    alertDiv.textContent = 'Server error';
  }
});
