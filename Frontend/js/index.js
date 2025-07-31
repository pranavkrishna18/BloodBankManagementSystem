// ✅ Load Blood Inventory and Render Chart
async function loadInventoryChart() {
  try {
    const res = await fetch("http://localhost:5000/api/public/inventory");
    const rawInventory = await res.json();

    const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    const inventoryMap = Object.fromEntries(bloodGroups.map(bg => [bg, 0]));
    rawInventory.forEach(i => {
      inventoryMap[i.bloodType] = i.units;
    });

    const labels = Object.keys(inventoryMap);
    const values = Object.values(inventoryMap);
    const totalUnits = values.reduce((sum, val) => sum + val, 0);

    // 🩸 Display summary
    const summaryDiv = document.getElementById("summary");
    const lowStock = labels.filter((bg, i) => values[i] <= 5);
    summaryDiv.innerHTML = `
      <strong>Total Units Available:</strong> ${totalUnits}
      ${lowStock.length > 0 
        ? `<br><span class="low-stock">⚠️ Low stock: ${lowStock.join(", ")}</span>` 
        : `<br><span style="color:green;">✅ All blood groups sufficiently stocked</span>`
      }
    `;

    // 📊 Create Chart
    const ctx = document.getElementById("bloodChart").getContext("2d");
    if (window.bloodChartInstance) window.bloodChartInstance.destroy();

    window.bloodChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Units",
          data: values,
          backgroundColor: values.map(v => v <= 5 ? "#ff4d4f" : "#52b788"),
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // 🔧 Allow taller charts
        animation: {
          duration: 1000,
          easing: "easeOutBounce"
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "🩸 Blood Inventory",
            font: { size: 22 },
            color: "#e63946"
          },
          tooltip: {
            callbacks: {
              label: ctx => `Available: ${ctx.raw} unit(s)`
            }
          },
          datalabels: {
            color: "#111",
            anchor: "end",
            align: "end",  // 🔼 Move label above bar
            offset: -6,     // 🔼 Spacing above
            font: {
              weight: "bold",
              size: 18
            },
            formatter: (val) => `${val}`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Units",
              color: "#555"
            },
            ticks: {
              stepSize: 1,
              color: "#555",
              font: { size: 14 }
            }
          },
          x: {
            ticks: {
              color: "#555",
              font: { size: 14 }
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });

  } catch (err) {
    console.error("❌ Error loading blood inventory:", err);
    const errorMessage = document.getElementById("summary");
    errorMessage.innerHTML = `<span style="color: red;">❌ Unable to load inventory. Please try again later.</span>`;
  }
}

// 🔁 Optional Manual Refresh
document.getElementById("refreshBtn")?.addEventListener("click", () => {
  loadInventoryChart();
});

// 🚀 On Page Load
window.addEventListener("DOMContentLoaded", () => {
  loadInventoryChart();
});
