// 🌀 Hide loader after page load
window.addEventListener("load", () => {
  document.getElementById("loader").style.display = "none";
});

// 🧾 Auth check
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
document.getElementById("usernameDisplay").innerText = user?.name || "Admin";

if (!token || user?.role !== "admin") {
  alert("Unauthorized! Redirecting...");
  window.location.href = "login.html";
}

// 📄 UI Elements
const pendingList = document.getElementById("pendingRequests");
const totalRequestsCounter = document.createElement("p");
const filterSelect = document.createElement("select");
let chart = null;
let weeklyChart, topBloodChart, locationChart;

// 👇 Add dropdown filter to DOM
filterSelect.innerHTML = `
  <option value="">All Blood Types</option>
  <option value="A+">A+</option>
  <option value="A-">A-</option>
  <option value="B+">B+</option>
  <option value="B-">B-</option>
  <option value="O+">O+</option>
  <option value="O-">O-</option>
  <option value="AB+">AB+</option>
  <option value="AB-">AB-</option>
`;
filterSelect.style.margin = "10px 0";
filterSelect.style.padding = "6px";
filterSelect.style.borderRadius = "6px";
pendingList.before(filterSelect);
pendingList.before(totalRequestsCounter);

// 🛠️ Load Pending Requests
async function loadRequests() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await res.json();
    pendingList.innerHTML = "";

    const selectedType = filterSelect.value;
    const filtered = selectedType
      ? requests.filter((r) => r.bloodType === selectedType)
      : requests;

    totalRequestsCounter.innerHTML = `📊 Showing ${filtered.length} request(s)${
      selectedType ? ` for <strong>${selectedType}</strong>` : ""
    }`;

    if (filtered.length === 0) {
      pendingList.innerHTML = "<li>No pending requests</li>";
      return;
    }

    filtered.forEach((r) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="margin-bottom: 10px; background: #f4f4f4; padding: 10px; border-radius: 8px;">
          <strong>${r.bloodType}</strong> at ${r.location}<br/>
          Date: ${new Date(r.date).toLocaleDateString()}<br/>
          <button onclick="updateRequest('${r._id}', 'approved')" style="margin: 5px; background: green; color: white;">Approve</button>
          <button onclick="updateRequest('${r._id}', 'rejected')" style="margin: 5px; background: crimson; color: white;">Reject</button>
        </div>
      `;
      pendingList.appendChild(li);
    });
  } catch (err) {
    alert(`❌ Error loading requests:\n${err.message}`);
    console.error("Request Load Error:", err);
  }
}

// 🧠 Update Request Status
async function updateRequest(id, status) {
  try {
    const res = await fetch(`http://localhost:5000/api/admin/request/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    alert(data.message);
    loadRequests();
    loadInventory();
    loadAnalytics();
  } catch (err) {
    alert(`❌ Update Failed:\n${err.message}`);
    console.error("Update Error:", err);
  }
}

// 📊 Load Inventory Chart
async function loadInventory() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/inventory", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const rawInventory = await res.json();

    const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    const inventoryMap = Object.fromEntries(bloodGroups.map(bg => [bg, 0]));

    rawInventory.forEach(i => {
      inventoryMap[i.bloodType] = i.units;
    });

    const labels = Object.keys(inventoryMap);
    const data = Object.values(inventoryMap);

    const ctx = document.getElementById("inventoryChart").getContext("2d");
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Available Units",
          data,
          backgroundColor: [
            "#e63946", "#f1a208", "#52b788", "#219ebc",
            "#6a4c93", "#ff006e", "#00b4d8", "#8338ec",
          ],
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "🩸 Blood Stock by Type",
            font: { size: 18 },
            color: "#333",
          },
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Units" },
          },
        },
      },
    });
  } catch (err) {
    alert(`❌ Inventory Load Error: ${err.message}`);
    console.error("Inventory Error:", err);
  }
}

// 📊 Load Analytics Charts
async function loadAnalytics() {
  try {
    const res = await fetch("http://localhost:5000/api/admin/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = res.headers.get("content-type");
    if (!res.ok || !contentType.includes("application/json")) {
      const text = await res.text();
      throw new Error(`Analytics response error:\n${text}`);
    }

    const analytics = await res.json();

    // Safely destructure and fallback to empty values
    const weeklyData = analytics.weeklyDonations || { labels: [], data: [] };
    const bloodData = analytics.topBloodGroups || { labels: [], data: [] };
    const locationData = analytics.locationStats || { labels: [], data: [] };

    // ✅ Weekly Donation Chart
    const ctx1 = document.getElementById("weeklyDonationsChart").getContext("2d");
    new Chart(ctx1, {
      type: "line",
      data: {
        labels: weeklyData.labels,
        datasets: [
          {
            label: "Donations",
            data: weeklyData.data,
            fill: false,
            borderColor: "#0077b6",
            tension: 0.2,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Weekly Donation Trends",
            color: "#333",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    });

    // ✅ Top Blood Groups Chart
    const ctx2 = document.getElementById("topBloodChart").getContext("2d");
    new Chart(ctx2, {
      type: "pie",
      data: {
        labels: bloodData.labels,
        datasets: [
          {
            label: "Requests",
            data: bloodData.data,
            backgroundColor: [
              "#ff595e", "#ffca3a", "#8ac926", "#1982c4",
              "#6a4c93", "#f72585", "#4cc9f0", "#3a0ca3"
            ],
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Most Requested Blood Types",
            color: "#333",
          },
        },
      },
    });

    // ✅ Location-wise Chart
    const ctx3 = document.getElementById("locationChart").getContext("2d");
    new Chart(ctx3, {
      type: "bar",
      data: {
        labels: locationData.labels,
        datasets: [
          {
            label: "Total People",
            data: locationData.data,
            backgroundColor: "#00b4d8",
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Donor/Recipient Count by Location",
            color: "#333",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

  } catch (err) {
    alert("📊 Analytics Error:\n" + err.message);
    console.error("Analytics Error:", err);
  }
}

// 🔓 Logout
function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

// 🔄 Initial Load
loadRequests();
loadInventory();
loadAnalytics();
filterSelect.addEventListener("change", loadRequests);
