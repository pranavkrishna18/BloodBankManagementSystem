document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const city = document.getElementById('city').value;
  const alertDiv = document.getElementById('registerAlert');

  if (!name || !email || !password || !role || !city) {
    alertDiv.className = 'alert error';
    alertDiv.style.display = 'block';
    alertDiv.textContent = '❗ Please fill in all fields including city';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, city })
    });

    const data = await res.json();

    if (res.ok) {
      alertDiv.className = 'alert success';
      alertDiv.style.display = 'block';
      alertDiv.textContent = '✅ Registration successful. Redirecting to login...';
      setTimeout(() => (window.location.href = 'login.html'), 1500);
    } else {
      alertDiv.className = 'alert error';
      alertDiv.style.display = 'block';
      alertDiv.textContent = data.message || '❌ Registration failed';
    }
  } catch (err) {
    alertDiv.className = 'alert error';
    alertDiv.style.display = 'block';
    alertDiv.textContent = '❌ Server error. Try again later.';
  }
});
