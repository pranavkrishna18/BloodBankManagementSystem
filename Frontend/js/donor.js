// 🌀 Hide loader on load
window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";

  // Set today's date as minimum in donationDate field
  const today = new Date().toISOString().split("T")[0];
  const donationDateInput = document.getElementById("donationDate");
  if (donationDateInput) {
    donationDateInput.setAttribute("min", today);
  }
  loadEligibility(); // ⏳ Load eligibility info after loader hides
});

// 🧾 Authentication check
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
document.getElementById('usernameDisplay').innerText = user?.name || 'Donor';

if (!token || user.role !== 'donor') {
  alert('Unauthorized! Redirecting...');
  window.location.href = 'login.html';
}

// 🌐 DOM elements
const donationForm = document.getElementById('donationForm');
const donationAlert = document.getElementById('donationAlert');
const donationHistory = document.getElementById('donationHistory');
const eligibilityBox = document.getElementById('eligibilityInfo');

// 🩸 Submit donation form
donationForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const bloodType = document.getElementById('bloodType').value.trim();
  const location = document.getElementById('location').value.trim();
  const donationDate = document.getElementById('donationDate').value;

  if (!bloodType || !location || !donationDate) {
    showAlert('❗ Please fill in all fields', 'error');
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/donor/donate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ bloodType, location, date: donationDate })
    });

    const data = await res.json();

    if (res.ok) {
      showAlert(`✅ ${data.message}`, 'success');
      donationForm.reset();
      loadHistory();
      loadEligibility(); // refresh eligibility after new donation
    } else {
      showAlert(`❌ ${data.message || 'Donation failed'}`, 'error');
    }
  } catch (err) {
    console.error('Donation error:', err);
    showAlert('❌ Server error. Try again later.', 'error');
  }
});

// 🛎️ Show alert messages
function showAlert(message, type = 'success') {
  donationAlert.textContent = message;
  donationAlert.className = `alert ${type}`;
  setTimeout(() => {
    donationAlert.textContent = '';
    donationAlert.className = 'alert';
  }, 4000);
}

// 📜 Load donation history
async function loadHistory() {
  try {
    const res = await fetch('http://localhost:5000/api/donor/history', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    donationHistory.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      donationHistory.innerHTML = '<li>No donations found.</li>';
      return;
    }

    data.forEach(d => {
      const date = new Date(d.date);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${d.bloodType}</strong> at <em>${d.location}</em><br>
        📅 ${formattedDate} | ⏰ ${formattedTime}
      `;
      donationHistory.appendChild(li);
    });

  } catch (err) {
    console.error('History load error:', err);
    donationHistory.innerHTML = '<li>Error loading donation history.</li>';
  }
}

// ⏳ Load eligibility info
async function loadEligibility() {
  try {
    const res = await fetch('http://localhost:5000/api/donor/eligibility', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    const nextDate = new Date(data.nextEligibleDate).toLocaleDateString();
    const box = document.createElement('div');
    box.className = `alert ${data.eligible ? 'success' : 'warning'}`;
    box.style.marginTop = '15px';

    if (data.eligible) {
      box.innerHTML = `✅ You are eligible to donate now.`;
    } else {
      box.innerHTML = `⏳ You can donate again on <strong>${nextDate}</strong> (${data.daysRemaining} day(s) remaining).`;
    }

    eligibilityBox.innerHTML = '';
    eligibilityBox.appendChild(box);
  } catch (err) {
    console.error('Eligibility fetch error:', err);
    eligibilityBox.innerHTML = `<div class="alert error">❌ Error fetching eligibility info</div>`;
  }
}

// 🚪 Logout
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// 🔁 Initial load
loadHistory();
