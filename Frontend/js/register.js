document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const alertDiv = document.getElementById('registerAlert');

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();

    if (res.ok) {
      alertDiv.className = 'alert success';
      alertDiv.textContent = 'Registration successful. Redirecting to login...';
      setTimeout(() => (window.location.href = 'login.html'), 1500);
    } else {
      alertDiv.className = 'alert error';
      alertDiv.textContent = data.message || 'Registration failed';
    }
  } catch (err) {
    alertDiv.className = 'alert error';
    alertDiv.textContent = 'Server error';
  }
});
