// Expense Tracker - frontend logic

const API_URL = "http://localhost:3000/api/expenses";

// Global variables to store all expenses in memory for filtering
let allExpenses = [];
let editModalInstance = null;

// DOM Elements
const alertContainer = document.getElementById("alertContainer");
const loadingSpinner = document.getElementById("loadingSpinner");
const expensesTableBody = document.getElementById("expensesTableBody");
const expenseForm = document.getElementById("expenseForm");
const editExpenseForm = document.getElementById("editExpenseForm");
const filterCategory = document.getElementById("filterCategory");

const totalAmountEl = document.getElementById("totalAmount");
const totalCountEl = document.getElementById("totalCount");
const highestAmountEl = document.getElementById("highestAmount");

// Initialize application on DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Bootstrap Modal instance for editing
  const modalEl = document.getElementById("editExpenseModal");
  if (modalEl) {
    editModalInstance = new bootstrap.Modal(modalEl);
  }

  // Set default date to today in forms
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").value = today;

  // Event Listeners
  expenseForm.addEventListener("submit", handleAddExpense);
  editExpenseForm.addEventListener("submit", handleUpdateExpense);
  filterCategory.addEventListener("change", applyFilter);

  // Initial load
  refresh();
});

// Helper: UI Feedback Functions
function showSpinner() {
  if (loadingSpinner) loadingSpinner.classList.remove("d-none");
}

function hideSpinner() {
  if (loadingSpinner) loadingSpinner.classList.add("d-none");
}

function showAlert(message, type = "danger") {
  if (!alertContainer) return;
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function clearAlert() {
  if (alertContainer) alertContainer.innerHTML = "";
}

// Helper: Badge formatting by category
function getCategoryBadgeClass(category) {
  switch (category) {
    case "Food": return "bg-primary";
    case "Transport": return "bg-info";      
    case "Bills": return "bg-danger";
    case "Entertainment": return "bg-warning"; 
    default: return "bg-secondary";
  }
}
// API Calls
async function getExpenses() {
  showSpinner();
  clearAlert();
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Server returned status ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("Failed to fetch")) {
      showAlert("Cannot connect to server. Please ensure backend server is running.");
    } else {
      showAlert(error.message);
    }
    return [];
  } finally {
    hideSpinner();
  }
}

async function addExpense(data) {
  showSpinner();
  clearAlert();
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to add expense");
    }

    return true;
  } catch (error) {
    showAlert(error.message);
    return false;
  } finally {
    hideSpinner();
  }
}

async function updateExpense(id, data) {
  showSpinner();
  clearAlert();
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to update expense");
    }

    return true;
  } catch (error) {
    showAlert(error.message);
    return false;
  } finally {
    hideSpinner();
  }
}

async function deleteExpense(id) {
  if (!confirm("Are you sure you want to delete this expense?")) return;

  showSpinner();
  clearAlert();
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || "Failed to delete expense");
    }

    await refresh();
  } catch (error) {
    showAlert(error.message);
  } finally {
    hideSpinner();
  }
}

// Refresh Data & Render UI
async function refresh() {
  const expenses = await getExpenses();
  allExpenses = Array.isArray(expenses) ? expenses : [];
  
  // Rule: Summary cards must ALWAYS calculate from all expenses
  renderSummary(allExpenses);
  
  // Render table with current category filter applied
  applyFilter();
}

function renderSummary(list) {
  if (!list || list.length === 0) {
    totalAmountEl.textContent = "$0.00";
    totalCountEl.textContent = "0";
    highestAmountEl.textContent = "$0.00";
    return;
  }

  const total = list.reduce((sum, item) => sum + Number(item.amount), 0);
  const highest = Math.max(...list.map(item => Number(item.amount)));

  totalAmountEl.textContent = `$${total.toFixed(2)}`;
  totalCountEl.textContent = list.length;
  highestAmountEl.textContent = `$${highest.toFixed(2)}`;
}

function renderTable(list) {
  expensesTableBody.innerHTML = "";

  if (!list || list.length === 0) {
    expensesTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-4">No expenses found</td>
      </tr>
    `;
    return;
  }

  list.forEach(item => {
    const tr = document.createElement("tr");

    // Format date string safely
    const formattedDate = item.date ? item.date.split("T")[0] : "";

    tr.innerHTML = `
      <td class="fw-medium ps-4">${escapeHtml(item.title)}</td>
      <td class="fw-bold">$${Number(item.amount).toFixed(2)}</td>
      <td>
        <span class="badge ${getCategoryBadgeClass(item.category)}">
          ${escapeHtml(item.category)}
        </span>
      </td>
      <td class="text-secondary">${formattedDate}</td>
      <td class="text-end pe-4">
        <button class="btn btn-sm btn-light border me-1 edit-btn" data-id="${item.id}">Edit</button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.id}">Delete</button>
      </td>
    `;

    // Attach Event Listeners to dynamic buttons
    tr.querySelector(".edit-btn").addEventListener("click", () => openEditModal(item));
    tr.querySelector(".delete-btn").addEventListener("click", () => deleteExpense(item.id));

    expensesTableBody.appendChild(tr);
  });
}

function applyFilter() {
  const selectedCategory = filterCategory.value;
  
  if (selectedCategory === "All") {
    renderTable(allExpenses);
  } else {
    const filtered = allExpenses.filter(item => item.category === selectedCategory);
    renderTable(filtered);
  }
}

// Handlers for Forms & Modals
async function handleAddExpense(e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
    showAlert("Please fill in all fields with valid data (Amount must be greater than 0).");
    return;
  }

  const payload = { title, amount, category, date };
  const success = await addExpense(payload);

  if (success) {
    expenseForm.reset();
    document.getElementById("date").value = new Date().toISOString().split("T")[0];
    await refresh();
  }
}

function openEditModal(item) {
  document.getElementById("editId").value = item.id;
  document.getElementById("editTitle").value = item.title;
  document.getElementById("editAmount").value = item.amount;
  document.getElementById("editCategory").value = item.category;
  
  const formattedDate = item.date ? item.date.split("T")[0] : "";
  document.getElementById("editDate").value = formattedDate;

  if (editModalInstance) {
    editModalInstance.show();
  }
}

async function handleUpdateExpense(e) {
  e.preventDefault();

  const id = document.getElementById("editId").value;
  const title = document.getElementById("editTitle").value.trim();
  const amount = parseFloat(document.getElementById("editAmount").value);
  const category = document.getElementById("editCategory").value;
  const date = document.getElementById("editDate").value;

  if (!id || !title || isNaN(amount) || amount <= 0 || !category || !date) {
    showAlert("Please fill in all edit fields correctly.");
    return;
  }

  const payload = { title, amount, category, date };
  const success = await updateExpense(id, payload);

  if (success) {
    if (editModalInstance) {
      editModalInstance.hide();
    }
    await refresh();
  }
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Dark Mode Toggle Logic using Bootstrap Icons
const toggleBtn = document.getElementById('darkModeToggle');
const themeIcon = document.getElementById('themeIcon');

// Check saved theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  if (themeIcon) {
    themeIcon.classList.remove('bi-moon-fill');
    themeIcon.classList.add('bi-sun-fill');
  }
}

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    // Save preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Switch icon between Sun and Moon
    if (themeIcon) {
      if (isDark) {
        themeIcon.classList.remove('bi-moon-fill');
        themeIcon.classList.add('bi-sun-fill');
      } else {
        themeIcon.classList.remove('bi-sun-fill');
        themeIcon.classList.add('bi-moon-fill');
      }
    }
  });
}