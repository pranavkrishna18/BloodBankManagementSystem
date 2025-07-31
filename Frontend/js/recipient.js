// 🌀 Hide loader on page load
window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});

// 🧾 Auth Check
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));
document.getElementById('usernameDisplay').innerText = user?.name || 'Recipient';

if (!token || user?.role !== 'recipient') {
  alert('Unauthorized! Redirecting...');
  window.location.href = 'login.html';
}

// 🌐 DOM Elements
const requestForm = document.getElementById('requestForm');
const requestAlert = document.getElementById('requestAlert');
const requestHistory = document.getElementById('requestHistory');

// 🩸 Handle Blood Request Form Submission
requestForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const bloodType = document.getElementById('bloodType').value.trim();
  const location = document.getElementById('location').value.trim();
  const requestDate = document.getElementById('requestDate').value; // 📅 New field

  if (!bloodType || !location || !requestDate) {
    showAlert('❗ Please fill all fields', 'error');
    return;
  }

  try {
    const res = await fetch('http://localhost:5000/api/recipient/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ bloodType, location, date: requestDate })
    });

    const data = await res.json();

    if (res.ok) {
      showAlert(`✅ ${data.message}`, 'success');
      requestForm.reset();
      loadHistory();
    } else {
      showAlert(`❌ ${data.message || 'Something went wrong'}`, 'error');
    }
  } catch (err) {
    showAlert('❌ Server error. Please try again later.', 'error');
    console.error('Request failed:', err);
  }
});

// ✅ Show alerts with auto-dismiss
function showAlert(message, type = 'success') {
  requestAlert.textContent = message;
  requestAlert.className = `alert ${type}`;
  setTimeout(() => {
    requestAlert.textContent = '';
    requestAlert.className = 'alert';
  }, 4000);
}

// 📜 Load Recipient Request History
async function loadHistory() {
  try {
    const res = await fetch('http://localhost:5000/api/recipient/my-requests', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error('Invalid response:', data);
      requestHistory.innerHTML = '<li>Error loading request history.</li>';
      return;
    }

    requestHistory.innerHTML = '';

    if (data.length === 0) {
      requestHistory.innerHTML = '<li>No requests found yet.</li>';
      return;
    }

    data.forEach(r => {
      const date = new Date(r.date);
      const formattedDate = date.toLocaleDateString();
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const statusBadge = getStatusBadge(r.status);

      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${r.bloodType}</strong> at <em>${r.location}</em><br>
        📅 ${formattedDate} | ⏰ ${formattedTime} &nbsp; ${statusBadge}
      `;
      requestHistory.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading request history:', err);
    requestHistory.innerHTML = '<li>Error loading history.</li>';
  }
}

// 🟡 Status Badge Generator
function getStatusBadge(status) {
  const lower = status.toLowerCase();
  switch (lower) {
    case 'approved':
      return `<span class="badge approved">✅ Approved</span>`;
    case 'rejected':
      return `<span class="badge rejected">❌ Rejected</span>`;
    default:
      return `<span class="badge pending">⏳ Pending</span>`;
  }
}

// 🚪 Logout
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// 🔃 Initial Load
loadHistory();
async function loadApprovedRequests() {
  try {
    const res = await fetch("http://localhost:5000/api/recipient/approved-requests", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    const container = document.getElementById("approvedRequests");
    container.innerHTML = "";

    if (data.length === 0) {
      container.innerHTML = "<p>No approved requests yet.</p>";
      return;
    }

    data.forEach(group => {
      const section = document.createElement("div");
      section.className = "blood-group-section";
      section.innerHTML = `<h3>${group._id}</h3>`;

      group.requests.forEach(req => {
        const card = document.createElement("div");
        card.className = "request-card";
        card.innerHTML = `
          <p><strong>Date:</strong> ${new Date(req.date).toLocaleDateString()}</p>
          <p><strong>Location:</strong> ${req.location}</p>
        `;
        section.appendChild(card);
      });

      container.appendChild(section);
    });

  } catch (err) {
    console.error("Approved Request Load Error:", err);
    document.getElementById("approvedRequests").innerHTML = "<p>❌ Failed to load requests.</p>";
  }
}

loadApprovedRequests();
