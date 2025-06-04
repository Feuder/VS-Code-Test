import { checkLoginStatus, apiFetch, logout } from './Einlog.js';

async function saveObject() {
    const name = document.getElementById('name').value.trim();
    const typ = document.getElementById('typ').value.trim();
    const status = document.getElementById('status').value;
    const standort = document.getElementById('standort').value;
    const abteilung = document.getElementById('abteilung').value;
    const person = document.getElementById('person').value;
    const preisRaw = document.getElementById('preis').value.trim();
    const preis = parseFloat(preisRaw);

    if (!name || !typ || !status || isNaN(preis) || preis <= 0) {
        alert('Bitte alle Pflichtfelder korrekt ausfüllen (Name, Typ, Preis > 0).');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Nicht angemeldet - bitte neu einloggen.');
        window.location.href = 'Login.html';
        return;
    }

    try {
        const item = await apiFetch('/save-object', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ name, typ, status, standort, abteilung, person, preis })
        });

        const tbody = document.getElementById('hardware-table-body');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" value="${item.id}"></td>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.typ}</td>
            <td>${item.status}</td>
            <td>${item.standort}</td>
            <td>${item.abteilung}</td>
            <td>${item.person}</td>
            <td>${item.preis.toFixed(2)} €</td>
        `;
        tbody.prepend(row);

        document.getElementById('objektFormular').reset();
        document.getElementById('modal').style.display = 'none';

    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}
window.saveObject = saveObject;

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {

    checkLoginStatus();

    document.getElementById('openbtn')
    .addEventListener('click', () => {
      document.getElementById('modal').style.display = 'block';
    });
  
    document.querySelector('.close')
    .addEventListener('click', () => {
      document.getElementById('modal').style.display = 'none';
    });

    document.getElementById('objektFormular')
        .addEventListener('submit', async e => {
            e.preventDefault();
            await saveObject();
        });

    const kategorienButtons = document.querySelectorAll('.side-bar button');
    kategorienButtons.forEach(button => {
        button.addEventListener('click', () => {
            const kategorie = button.textContent.trim();
            filterObjectsByCategory(kategorie);
        });
    });

    const unterKategorienLinks = document.querySelectorAll('.sub-category a');
    unterKategorienLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const kategorie = link.textContent.trim();
            filterObjectsByCategory(kategorie);
        });
    });

    const standortElement = document.getElementById("standort");
    if (standortElement) {
        standortElement.addEventListener("change", updateDepartmentOptions);
    }

    const abteilungElement = document.getElementById("abteilung");
    if (abteilungElement) {
        abteilungElement.addEventListener("change", updatePersonOptions);
    }

    const deleteButton = document.getElementById('delete-button');
    if (deleteButton) {
        deleteButton.addEventListener('click', deleteSelectedObjects);
    }

    document.querySelectorAll('select[id^="filter-"]').forEach((dropdown) => {
        dropdown.addEventListener('change', (event) => {
            const value = event.target.value;
            const index = parseInt(dropdown.id.replace('filter-', ''));
            updateFilter(index, value);
        });
    });

    loadObjects();
    updateDepartmentOptions();
    updatePersonOptions();
    loadHardwareData();

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});

async function deleteSelectedObjects() {
    const selectedCheckboxes = document.querySelectorAll('.row-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedIds.length === 0) {
        alert('Bitte markieren Sie mindestens ein Objekt zum Löschen.');
        return;
    }
    if (!confirm(`Möchten Sie die folgenden Objekte löschen?\n${selectedIds.join(', ')}`)) {
        return;
    }

    const token = localStorage.getItem('token');
    try {
        for (const id of selectedIds) {
            await apiFetch(`/details/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const row = document.querySelector(`.row-checkbox[value="${id}"]`)?.closest('tr');
            if (row) row.remove();
        }
    } catch (error) {
        alert(error.message);
        console.error(error);
    }
}

function loadObjects() {
    const token = localStorage.getItem('token');
    apiFetch('/items', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(data => {
        populateTable(data);
    })
    .catch(error => {
        console.error('Fehler beim Laden der Objekte:', error);
    });
}

async function loadHardwareData() {
    try {
        const token = localStorage.getItem('token');
        const hardwareData = await apiFetch('/items', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        window.populateDropdowns(hardwareData);
    } catch (error) {
        console.error('Fehler:', error);
    }
}

function selectCategory(category) {
    const subCategory = document.getElementById(category + '-sub');
    const arrow = document.getElementById(category + '-arrow');

    if (!subCategory.classList.contains('open')) {
        subCategory.classList.add('open');
        arrow.classList.add('down');
    } else {
        subCategory.classList.remove('open');
        arrow.classList.remove('down');
    }
}

async function loadTableData() {
    try {
        const data = await apiFetch('/items');
        populateTable(data); 
    } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
    }
}

function zustate() {
    window.location.href = "index.html";
}

var generateId = (function() {
    var id = 0;
    return function() {
        if (arguments[0] === 0) id = 0; 
        return id++; 
    }
})();

function populateTable(data) {
    const tableBody = document.getElementById('hardware-table-body');
    tableBody.innerHTML = ''; 

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="row-checkbox" value="${item.id}"></td>
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.typ}</td>
            <td>${item.status}</td>
            <td>${item.standort}</td>
            <td>${item.abteilung}</td>
            <td>${item.person}</td>
            <td>${item.preis} €</td>
        `;
        tableBody.appendChild(row);
    });
}

function showDetails(item) {
    const modalContent = `
        <h1>Details für ${item.name}</h1>
        <p><strong>Typ:</strong> ${item.typ}</p>
        <p><strong>Status:</strong> ${item.status}</p>
        <p><strong>Standort:</strong> ${item.standort}</p>
        <p><strong>Abteilung:</strong> ${item.abteilung}</p>
        <p><strong>Person:</strong> ${item.person}</p>
        <p><strong>Preis:</strong> ${item.preis} €</p>
    `;
    const modal = document.getElementById('details-modal');
    modal.querySelector('.modal-content').innerHTML = modalContent;
    modal.style.display = 'block';
}

function closedetailModal() {
    const modal = document.getElementById('details-modal');
    modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('hardware-table-body');
    if (tableBody) {
        tableBody.addEventListener('dblclick', (event) => {
            const row = event.target.closest('tr');
            if (row) {
                const objectId = row.querySelector('.row-checkbox').value;
                if (objectId) {
                    window.open("../Hardware/Erweiterte Ansicht/EA.HTML");
                }
            }
        });
    }
});

const options = {
    "Zugewiesen": {
        "HH": {
            "IT": ["Müller", "Schmidt"],
            "HR": ["Meier"]
        },
        "HB": {
            "Logistik": ["Schulz"],
            "Marketing": ["Klein"]
        }
    }
};

function iftest() {
    const status = document.getElementById("status").value;

    if (status === "Zugewiesen") {
        showAllDropdowns();
        updateAllDropdowns();
    } else {
        hideAllDropdowns();
    }
}

function showAllDropdowns() {
    document.getElementById("standort-label").style.display = "block";
    document.getElementById("standort").style.display = "block";

    document.getElementById("abteilung-label").style.display = "block";
    document.getElementById("abteilung").style.display = "block";

    document.getElementById("person-label").style.display = "block";
    document.getElementById("person").style.display = "block";
}

function hideAllDropdowns() {
    document.getElementById("standort-label").style.display = "none";
    document.getElementById("standort").style.display = "none";

    document.getElementById("abteilung-label").style.display = "none";
    document.getElementById("abteilung").style.display = "none";

    document.getElementById("person-label").style.display = "none";
    document.getElementById("person").style.display = "none";

    resetDropdown("standort");
    resetDropdown("abteilung");
    resetDropdown("person");
}

function updateAllDropdowns() {
    updateStandortOptions();
    updateDepartmentOptions();
    updatePersonOptions();
}

function updateStandortOptions() {
    const standort = document.getElementById("standort");
    resetDropdown("standort");

    if (options["Zugewiesen"]) {
        const standorte = Object.keys(options["Zugewiesen"]);
        standorte.forEach(standortKey => {
            const option = document.createElement("option");
            option.value = standortKey;
            option.textContent = standortKey;
            standort.appendChild(option);
        });
    }
}

function updateDepartmentOptions() {
    const standort = document.getElementById("standort").value || Object.keys(options["Zugewiesen"])[0];
    const abteilungsSelect = document.getElementById("abteilung");

    resetDropdown("abteilung");

    if (options["Zugewiesen"][standort]) {
        const abteilungen = Object.keys(options["Zugewiesen"][standort]);
        abteilungen.forEach(abteilungKey => {
            const option = document.createElement("option");
            option.value = abteilungKey;
            option.textContent = abteilungKey;
            abteilungsSelect.appendChild(option);
        });
    }
}

function updatePersonOptions() {
    const standort = document.getElementById("standort").value || Object.keys(options["Zugewiesen"])[0];
    const abteilung = document.getElementById("abteilung").value || Object.keys(options["Zugewiesen"][standort])[0];
    const personenSelect = document.getElementById("person");

    resetDropdown("person");

    if (options["Zugewiesen"][standort] && options["Zugewiesen"][standort][abteilung]) {
        const personen = options["Zugewiesen"][standort][abteilung];
        personen.forEach(person => {
            const option = document.createElement("option");
            option.value = person;
            option.textContent = person;
            personenSelect.appendChild(option);
        });
    }
}

function resetDropdown(id) {
    const dropdown = document.getElementById(id);
    dropdown.innerHTML = '<option value="">-- Auswahl treffen --</option>';
}

document.getElementById("status").addEventListener("change", iftest);

function filterObjectsByCategory(category) {
    const tableBody = document.getElementById('hardware-table-body');
    if (!tableBody) {
        console.error("Element mit ID 'hardware-table-body' nicht gefunden.");
        return;
    }
    const rows = tableBody.getElementsByTagName('tr');

    for (let row of rows) {
        const typeCell = row.cells[2];
        if (!typeCell) {
            continue;
        }

        if (typeCell.textContent === category) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    async function loadHardwareData() {
        try {
            const token = localStorage.getItem('token');
            const hardwareData = await apiFetch('/items', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    contentType: 'application/json'
                }
            });
            updateTable(hardwareData);
            populateDropdowns(hardwareData);
        } catch (error) {
            console.error('Fehler:', error);
        }
    }

    window.populateDropdowns = function(hardwareData) {
        const dropdowns = {
            0: document.getElementById('filter-id'),
            1: document.getElementById('filter-name'),
            2: document.getElementById('filter-type'),
            3: document.getElementById('filter-status'),
            4: document.getElementById('filter-location'),
            5: document.getElementById('filter-department'),
            6: document.getElementById('filter-person'),
            7: document.getElementById('filter-price')
        };

        Object.keys(dropdowns).forEach(index => {
            if (!dropdowns[index]) {
                console.error(`Dropdown mit Index ${index} wurde nicht gefunden.`);
                return;
            }
        });

        const uniqueValues = Array.from({ length: 8 }, () => new Set());

        hardwareData.forEach(item => {
            uniqueValues[0].add(item.id);
            uniqueValues[1].add(item.name);
            uniqueValues[2].add(item.typ);
            uniqueValues[3].add(item.status);
            uniqueValues[4].add(item.standort);
            uniqueValues[5].add(item.abteilung);
            uniqueValues[6].add(item.person);
            uniqueValues[7].add(item.preis);
        });

        Object.keys(dropdowns).forEach(index => {
            const dropdown = dropdowns[index];
            if (!dropdown) {
                console.warn(`Dropdown mit Index ${index} existiert nicht.`);
                return;
            }
            const currentFilter = activeFilters[index];
            
            dropdown.innerHTML = '<option value="">Filtern...</option>'; 
            
            uniqueValues[index].forEach(value => {
                if (value !== undefined && value !== "") {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    if (value === currentFilter) {
                        option.selected = true;
                    }
                    dropdown.appendChild(option);
                }
            });
        });
    }

    window.updateFilter = function(column, value) {
        activeFilters[column] = value;
        filterTable();
    }

    const activeFilters = {
        0: "",
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: ""
    };

    function filterTable() {
        const tableBody = document.getElementById('hardware-table-body');
        if (!tableBody) {
            console.error("Tabellenkörper mit ID 'hardware-table-body' wurde nicht gefunden.");
            return;
        }
        let visibleRows = Array.from(tableBody.rows);

        visibleRows.forEach(row => {
            let shouldDisplay = true;

            for (let colIndex = 1; colIndex < row.cells.length; colIndex++) { 
                const cell = row.cells[colIndex];
                if (!cell) {
                    continue;
                }
                const cellValue = cell.textContent.trim();
                const filterValue = activeFilters[colIndex - 1]; 
                
                if (filterValue && cellValue !== filterValue) {
                    shouldDisplay = false;
                    break;
                }
            }

            row.style.display = shouldDisplay ? "" : "none";
        });
    }

    document.querySelectorAll('select[id^="filter-"]').forEach((dropdown) => {
        dropdown.addEventListener('change', (event) => {
            const value = event.target.value;
            const index = parseInt(dropdown.id.replace('filter-', ''));
            updateFilter(index, value);
        });
    });

    function updateTable(hardwareData) {
        const tbody = document.getElementById('hardware-table-body');
        if (!tbody) {
            console.error("Tabellenkörper mit ID 'hardware-table-body' wurde nicht gefunden.");
            return;
        }
        tbody.innerHTML = '';

        hardwareData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" value="${item.id}"></td>
                <td>${item.id ? item.id : 'N/A'}</td>
                <td>${item.name ? item.name : 'N/A'}</td>
                <td>${item.typ ? item.typ : 'N/A'}</td>
                <td>${item.status ? item.status : 'N/A'}</td>
                <td>${item.standort ? item.standort : 'N/A'}</td>
                <td>${item.abteilung ? item.abteilung : 'N/A'}</td>
                <td>${item.person ? item.person : 'N/A'}</td>
                <td>${item.preis ? item.preis + ' €' : 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    loadHardwareData();
});

document.getElementById('objektFormular').addEventListener('submit', e => {
    e.preventDefault();    // verhindert das Neuladen
    saveObject();          // führt stattdessen deine Save-Logik aus
  });
  