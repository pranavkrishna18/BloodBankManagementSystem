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
const totalRequestsCounter = document.getElementById("totalRequestsCount");
const filterSelect = document.getElementById("filterSelect");
const adminCitySelect = document.getElementById("adminCitySelect");
const adminInventoryCitySelect = document.getElementById("adminInventoryCitySelect");
let chart = null;
let weeklyChart, topBloodChart, locationChart;

// 🛠️ Load Pending Requests
async function loadRequests() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const requests = await res.json();
    pendingList.innerHTML = "";

    const selectedType = filterSelect.value;
    const selectedCity = adminCitySelect.value;
    
    const filtered = requests.filter((r) => {
      const typeMatch = !selectedType || r.bloodType === selectedType;
      const cityMatch = !selectedCity || (r.city === selectedCity);
      return typeMatch && cityMatch;
    });

    totalRequestsCounter.innerHTML = `📊 Showing ${filtered.length} request(s)${
      selectedType ? ` for <strong>${selectedType}</strong>` : ""
    }${selectedCity ? ` in <strong>${selectedCity}</strong>` : ""}`;

    if (filtered.length === 0) {
      pendingList.innerHTML = "<li>No pending requests</li>";
      return;
    }

    filtered.forEach((r) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div style="margin-bottom: 10px; background: rgba(192,57,43,0.1); padding: 12px; border-radius: 8px; border-left: 4px solid #e74c3c;">
          <strong>${r.bloodType}</strong> request at ${r.location}<br/>
          📍 ${r.city || 'N/A'} | 📅 ${new Date(r.date).toLocaleDateString()} | 🩸 <strong>Units Needed: ${r.units || 1}</strong><br/>
          <button onclick="updateRequest('${r._id}', 'approved')" class="approve" style="margin: 8px 5px 0 0;">✅ Approve</button>
          <button onclick="updateRequest('${r._id}', 'rejected')" class="reject">❌ Reject</button>
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
    const res = await fetch(`http://localhost:3000/api/admin/request/${id}`, {
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
    loadAdminInventory();
    loadAnalytics();  // This refreshes all stats including total units
  } catch (err) {
    alert(`❌ Update Failed:\n${err.message}`);
    console.error("Update Error:", err);
  }
}

// 📊 Load Inventory Chart (City-aware)
async function loadAdminInventory() {
  try {
    const city = adminInventoryCitySelect.value;
    const url = city
      ? `http://localhost:3000/api/admin/inventory?city=${encodeURIComponent(city)}`
      : `http://localhost:3000/api/admin/inventory`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const rawInventory = await res.json();

    // Build inventory map grouped by city and blood type
    const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    const cities = [];
    const inventoryMap = {};

    rawInventory.forEach(item => {
      if (!cities.includes(item.city)) cities.push(item.city);
      const key = `${item.city}${item.bloodType}`;
      inventoryMap[key] = item.units;
    });

    // Update chart
    const chartLabels = bloodGroups;
    let chartData = [];
    
    if (city && cities.length > 0) {
      chartData = bloodGroups.map(bg => inventoryMap[`${city}${bg}`] || 0);
    } else if (cities.length > 0) {
      chartData = bloodGroups.map(bg => {
        const total = cities.reduce((sum, c) => sum + (inventoryMap[`${c}${bg}`] || 0), 0);
        return total;
      });
    }

    const ctx = document.getElementById("inventoryChart").getContext("2d");
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: chartLabels,
        datasets: [{
          label: `Available Units${city ? ` - ${city}` : ''}`,
          data: chartData,
          backgroundColor: chartData.map(val =>
            val === 0 ? "#808080" : val <= 5 ? "#e63946" : "#219ebc"
          ),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: 'var(--text-muted)' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: {
            ticks: { color: 'var(--text-muted)' },
            grid: { display: false }
          }
        },
      },
    });

    // Update inventory table
    updateAdminInventoryTable(inventoryMap, bloodGroups, cities);

    document.getElementById("lastUpdatedNote").textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    alert(`❌ Inventory Load Error: ${err.message}`);
    console.error("Inventory Error:", err);
  }
}

// 📋 Update Admin Inventory Table
function updateAdminInventoryTable(inventoryMap, bloodGroups, cities) {
  const tableBody = document.getElementById("adminInventoryTableBody");
  
  if (cities.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px; color: var(--text-muted);">No inventory data</td></tr>';
    return;
  }

  tableBody.innerHTML = cities.map(city => {
    let totalUnits = 0;
    let lowCount = 0;
    const items = bloodGroups.map(bg => {
      const key = `${city}${bg}`;
      const units = inventoryMap[key] || 0;
      totalUnits += units;
      if (units <= 5 && units > 0) lowCount++;
      return units;
    });

    let rowClass = '';
    let statusBadge = '';
    if (totalUnits === 0) {
      rowClass = 'style="background: rgba(200,50,50,0.2);"';
      statusBadge = '🔴 Empty';
    } else if (lowCount > 0) {
      rowClass = 'style="background: rgba(243,156,18,0.1);"';
      statusBadge = '⚠️ Low Stock';
    } else {
      rowClass = 'style="background: rgba(39,174,96,0.1);"';
      statusBadge = '✅ Good';
    }

    return `<tr ${rowClass}>
      <td style="padding: 12px; font-weight: 600;">${city}</td>
      ${items.map(units => {
        const color = units === 0 ? 'color: #999;' : units <= 5 ? 'color: #e74c3c;' : 'color: #27ae60;';
        return `<td style="text-align: center; padding: 12px; ${color} font-weight: 600;">${units}</td>`;
      }).join('')}
      <td style="text-align: center; padding: 12px;">${statusBadge}</td>
    </tr>`;
  }).join('');
}

// 📊 Load Analytics Charts
async function loadAnalytics() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/analytics", {
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

    // 📊 Update Statistics Cards
    try {
      const requestsRes = await fetch("http://localhost:3000/api/admin/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const requests = await requestsRes.json();
      const pendingCount = requests.filter(r => r.status !== 'approved' && r.status !== 'rejected').length;
      document.getElementById('pendingRequestsCard').textContent = pendingCount;
    } catch (err) {
      console.error("Error loading pending count:", err);
    }

    // Get total units and expiring
    try {
      const invRes = await fetch("http://localhost:3000/api/admin/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const inventory = await invRes.json();
      
      // Calculate total units from inventory array
      let totalUnits = 0;
      inventory.forEach(item => {
        totalUnits += item.units || 0;
      });
      
      // Get all donations to count expiring
      const donRes = await fetch("http://localhost:3000/api/admin/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const donations = await donRes.json();
      
      let expiringCount = 0;
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      donations.forEach(donation => {
        if (donation.expiryDate) {
          const expDate = new Date(donation.expiryDate);
          if (expDate <= sevenDaysFromNow && !donation.isExpired && donation.status === 'Completed') {
            expiringCount++;
          }
        }
      });
      
      document.getElementById('totalUnitsCard').textContent = totalUnits;
      document.getElementById('expiringCard').textContent = expiringCount;
    } catch (err) {
      console.error("Error loading inventory count:", err);
    }

    // Safely destructure and fallback to empty values
    const weeklyData = analytics.weeklyDonations || { labels: [], data: [] };
    const bloodData = analytics.topBloodGroups || { labels: [], data: [] };
    const locationData = analytics.locationStats || { labels: [], data: [] };

    // ✅ Weekly Donation Chart
    const ctx1 = document.getElementById("weeklyDonationsChart").getContext("2d");
    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(ctx1, {
      type: "line",
      data: {
        labels: weeklyData.labels,
        datasets: [
          {
            label: "Donations",
            data: weeklyData.data,
            fill: false,
            borderColor: "#e74c3c",
            backgroundColor: "rgba(231,76,60,0.1)",
            tension: 0.3,
            pointBackgroundColor: "#e74c3c",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: 'var(--text-muted)' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: { ticks: { color: 'var(--text-muted)' }, grid: { display: false } }
        },
      },
    });

    // ✅ Top Blood Groups Chart
    const ctx2 = document.getElementById("topBloodChart").getContext("2d");
    if (topBloodChart) topBloodChart.destroy();
    topBloodChart = new Chart(ctx2, {
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
            borderColor: "var(--bg-dark)",
            borderWidth: 2
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    // ✅ Location-wise Chart
    const ctx3 = document.getElementById("locationChart").getContext("2d");
    if (locationChart) locationChart.destroy();
    locationChart = new Chart(ctx3, {
      type: "bar",
      data: {
        labels: locationData.labels,
        datasets: [
          {
            label: "Total People",
            data: locationData.data,
            backgroundColor: "#e74c3c",
            borderRadius: 6
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: 'var(--text-muted)' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          x: { ticks: { color: 'var(--text-muted)' }, grid: { display: false } }
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

// 💉 Load Pending Donations
async function loadPendingDonations() {
  try {
    const res = await fetch("http://localhost:3000/api/admin/donations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const donations = await res.json();
    const donationsList = document.getElementById("pendingDonations");
    const donationsCount = document.getElementById("totalDonationsCount");
    
    donationsList.innerHTML = "";

    if (!Array.isArray(donations) || donations.length === 0) {
      donationsCount.innerHTML = "📊 No pending donations";
      donationsList.innerHTML = "<li>No pending donations</li>";
      return;
    }

    donationsCount.innerHTML = `📊 Showing ${donations.length} pending donation(s)`;

    donations.forEach((d) => {
      const li = document.createElement("li");
      const date = new Date(d.date).toLocaleDateString();
      const donorName = d.donor?.name || 'Unknown';
      const donationCity = d.city || 'N/A';  // 🔧 Fixed: use d.city instead of d.donor?.city
      
      li.innerHTML = `
        <div style="margin-bottom: 10px; background: rgba(52,152,219,0.1); padding: 12px; border-radius: 8px; border-left: 4px solid #3498db;">
          <strong>${d.bloodType}</strong> from <em>${donorName}</em><br/>
          📍 ${d.location} | 🏙️ ${donationCity} | 📅 ${date}<br/>
          <button onclick="updateDonation('${d._id}', 'approve')" class="approve" style="margin: 8px 5px 0 0; padding: 6px 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">✅ Approve</button>
          <button onclick="updateDonation('${d._id}', 'reject')" class="reject" style="margin: 8px 5px 0 0; padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">❌ Reject</button>
        </div>
      `;
      donationsList.appendChild(li);
    });
  } catch (err) {
    alert(`❌ Error loading donations:\n${err.message}`);
    console.error("Donation Load Error:", err);
  }
}

// 💉 Update Donation Status (Approve/Reject)
async function updateDonation(id, action) {
  try {
    const res = await fetch(`http://localhost:3000/api/admin/donation/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    alert(data.message);
    loadPendingDonations();
    loadAdminInventory();
    loadAnalytics();  // Refresh stats to show updated total units
  } catch (err) {
    alert(`❌ Update Failed:\n${err.message}`);
    console.error("Update Error:", err);
  }
}

// 🔄 Initial Load
loadRequests();
loadAdminInventory();
loadAnalytics();
loadPendingDonations();

// Add event listeners
filterSelect.addEventListener("change", loadRequests);
adminCitySelect.addEventListener("change", loadRequests);
adminInventoryCitySelect.addEventListener("change", loadAdminInventory);
