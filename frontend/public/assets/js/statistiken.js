import { checkLoginStatus, apiFetch, logout } from './Einlog.js';

let deviceData = [];

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();

    apiFetch('/statistics')
      .then(data => {
        const hardware = Array.isArray(data) ? data : data.items;
        deviceData = hardware;
        updateKPI(hardware, data);
        createChart("statusChart", "pie", getStatusData(hardware, data.statusCounts));
        createChart("timelineChart", "line", getTimelineData());
        populateTable(hardware);
      })
      .catch(err => console.error(err));

    // Falls ein Logout-Button existiert
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("toggle-dark-mode").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
    document.getElementById("apply-filter").addEventListener("click", () => {
        const statusFilter = Array.from(document.getElementById("filter-status").selectedOptions).map(opt => opt.value);
        const locationFilter = Array.from(document.getElementById("filter-location").selectedOptions).map(opt => opt.value);

        const filteredData = deviceData.filter(device =>
            (!statusFilter.length || statusFilter.includes(device.status)) &&
            (!locationFilter.length || locationFilter.includes(device.location))
        );
        populateTable(filteredData);
    });

    document.getElementById("toggle-dark-mode").addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
    });
});

function updateKPI(list, stats) {
    if (stats && typeof stats.total === 'number') {
        document.getElementById("total-devices").innerText = stats.total;
        document.getElementById("defective-devices").innerText = stats.defective;
        document.getElementById("assigned-devices").innerText = stats.assigned;
    } else {
        document.getElementById("total-devices").innerText = list.length;
        document.getElementById("defective-devices").innerText = list.filter(d => d.status === "Defekt").length;
        document.getElementById("assigned-devices").innerText = list.filter(d => d.status === "Zugewiesen").length;
    }
}

function createChart(canvasId, type, data) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, { type, data });
}

function getStatusData(list, counts) {
    const statusCounts = counts || list.reduce((acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
    }, { "Auf Lager": 0, "Zugewiesen": 0, "Defekt": 0 });
    return {
        labels: Object.keys(statusCounts),
        datasets: [{ data: Object.values(statusCounts), backgroundColor: ["#4caf50", "#ff9800", "#f44336"] }]
    };
}

function getTimelineData() {
    return {
        labels: ["Jan", "Feb", "Mär", "Apr", "Mai"],
        datasets: [{ label: "Neue Geräte", data: [10, 20, 15, 25, 30], borderColor: "#3498db", fill: false }]
    };
}

function populateTable(data) {
    const tableBody = document.getElementById("device-data");
    tableBody.innerHTML = "";
    data.forEach(device => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${device.id}</td>
            <td>${device.name}</td>
            <td>${device.category}</td>
            <td>${device.status}</td>
            <td>${device.location}</td>
            <td><button class="edit-button" data-id="${device.id}">Bearbeiten</button></td>
        `;
        tableBody.appendChild(row);
    });
}
