/* ==========================================================================
   Hans' Life Progress Tracker - Application Logic
   ========================================================================== */

// --- Constants ---
const API_BASE_URL = 'https://connect.craft.do/links/G3m5KGCYJN8/api/v1';
const COLLECTION_ID = '37B620E7-5713-424E-80D3-77F60F2023CD';

// --- State Management ---
const state = {
  tasks: [],
  loading: false,
  currentTab: 'timeline', // 'timeline', 'kanban', 'directory'
  searchQuery: '',
  statusFilter: 'all',
  dateFilter: 'all',
  sortField: 'due_date',
  sortAsc: true,
};

// --- DOM Elements Cache ---
let elements = {};

function initDOMElements() {
  elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    syncBadge: document.getElementById('syncBadge'),
    syncText: document.querySelector('.sync-text'),
    pulseDot: document.querySelector('.pulse-dot'),
    
    // Year progress
    yearProgressCircle: document.getElementById('yearProgressCircle'),
    yearProgressPercent: document.getElementById('yearProgressPercent'),
    currentYearTitle: document.getElementById('currentYearTitle'),
    yearProgressSub: document.getElementById('yearProgressSub'),
    
    // Stats count
    statCompleted: document.getElementById('statCompleted'),
    statInProgress: document.getElementById('statInProgress'),
    statTodo: document.getElementById('statTodo'),
    statOverdue: document.getElementById('statOverdue'),
    overdueCard: document.getElementById('overdueCard'),
    
    // Tabs & Panels
    navTabs: document.querySelectorAll('.nav-tab'),
    viewTimeline: document.getElementById('viewTimeline'),
    viewKanban: document.getElementById('viewKanban'),
    viewDirectory: document.getElementById('viewDirectory'),
    
    // Timeline
    timelineItemsContainer: document.getElementById('timelineItemsContainer'),
    
    // Kanban Columns
    cardsTodo: document.getElementById('cardsTodo'),
    cardsInProgress: document.getElementById('cardsInProgress'),
    cardsDone: document.getElementById('cardsDone'),
    countColTodo: document.getElementById('countColTodo'),
    countColInProgress: document.getElementById('countColInProgress'),
    countColDone: document.getElementById('countColDone'),
    
    // Directory Table
    taskSearchInput: document.getElementById('taskSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    statusFilterSelect: document.getElementById('statusFilterSelect'),
    dateFilterSelect: document.getElementById('dateFilterSelect'),
    directoryTableBody: document.getElementById('directoryTableBody'),
    tableEmptyState: document.getElementById('tableEmptyState'),
    tableHeaders: document.querySelectorAll('.directory-table th[data-sort]'),
    
    // Modal & Form
    taskModal: document.getElementById('taskModal'),
    modalTitle: document.getElementById('modalTitle'),
    taskForm: document.getElementById('taskForm'),
    editTaskId: document.getElementById('editTaskId'),
    taskTitleInput: document.getElementById('taskTitleInput'),
    taskStatusInput: document.getElementById('taskStatusInput'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskActionDateInput: document.getElementById('taskActionDateInput'),
    titleError: document.getElementById('titleError'),
    deleteTaskBtn: document.getElementById('deleteTaskBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    
    // Toast Container
    toastContainer: document.getElementById('toastContainer'),
  };
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  initTheme();
  setupEventListeners();
  updateYearProgress();
  fetchTasks();
  
  // Re-run year progress updater occasionally
  setInterval(updateYearProgress, 60000);
});

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

// --- Year Progress Calculations ---
function updateYearProgress() {
  const now = new Date();
  const year = now.getFullYear();
  
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
  
  const totalMs = endOfYear - startOfYear;
  const elapsedMs = now - startOfYear;
  
  const percentage = (elapsedMs / totalMs) * 100;
  const roundedPercent = percentage.toFixed(1);
  
  // SVG Stroke dash offsets
  const circumference = 2 * Math.PI * 42; // r=42 -> 263.89
  const offset = circumference - (percentage / 100) * circumference;
  
  if (elements.yearProgressCircle) {
    elements.yearProgressCircle.style.strokeDashoffset = offset;
  }
  if (elements.yearProgressPercent) {
    elements.yearProgressPercent.textContent = `${Math.round(percentage)}%`;
  }
  if (elements.currentYearTitle) {
    elements.currentYearTitle.textContent = `${year} Year Progress`;
  }
  
  // Custom motivational subtext
  const dayOfYear = Math.floor(elapsedMs / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = isLeapYear(year) ? 366 : 365;
  
  if (elements.yearProgressSub) {
    elements.yearProgressSub.textContent = `Day ${dayOfYear} of ${totalDays}. ${roundedPercent}% of the year elapsed. Make today count!`;
  }
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

// --- Date Utilities ---
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateFriendly(dateStr) {
  if (!dateStr) return 'No Date';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function isDateOverdue(dueDateStr, status) {
  if (!dueDateStr || status === 'Done') return false;
  const today = getTodayDateString();
  return dueDateStr < today;
}

// --- Craft API Services ---
async function fetchTasks() {
  setLoadingState(true);
  updateSyncStatus('Syncing...', 'yellow');
  
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${COLLECTION_ID}/items`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }
    
    const data = await response.json();
    state.tasks = data.items.map(item => ({
      id: item.id,
      title: item.title || 'Untitled Goal',
      status: item.properties.status || 'To-do',
      due_date: item.properties.due_date || '',
      take_action: item.properties.take_action || '',
    }));
    
    renderApp();
    updateSyncStatus('Synced with Craft', 'green');
  } catch (error) {
    console.error(error);
    showToast('Failed to load tasks from Craft docs', 'error');
    updateSyncStatus('Sync Error', 'yellow');
  } finally {
    setLoadingState(false);
  }
}

async function apiCreateTask(title, properties) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${COLLECTION_ID}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ title, properties }]
      })
    });
    
    if (!response.ok) throw new Error('API creation failed');
    showToast('Goal created successfully', 'success');
    fetchTasks();
  } catch (error) {
    console.error(error);
    showToast('Error creating goal in Craft docs', 'error');
  }
}

async function apiUpdateTask(id, title, properties) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${COLLECTION_ID}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemsToUpdate: [{ id, title, properties }]
      })
    });
    
    if (!response.ok) throw new Error('API update failed');
    showToast('Goal updated successfully', 'success');
    fetchTasks();
  } catch (error) {
    console.error(error);
    showToast('Error updating goal in Craft docs', 'error');
  }
}

async function apiDeleteTask(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${COLLECTION_ID}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idsToDelete: [id]
      })
    });
    
    if (!response.ok) throw new Error('API deletion failed');
    showToast('Goal deleted successfully', 'success');
    fetchTasks();
  } catch (error) {
    console.error(error);
    showToast('Error deleting goal in Craft docs', 'error');
  }
}

// --- Sync Badges & Loading states ---
function setLoadingState(isLoading) {
  state.loading = isLoading;
  if (isLoading) {
    elements.timelineItemsContainer.innerHTML = `
      <div class="loading-placeholder">
        <div class="skeleton skeleton-timeline-item"></div>
        <div class="skeleton skeleton-timeline-item"></div>
        <div class="skeleton skeleton-timeline-item"></div>
      </div>
    `;
    elements.cardsTodo.innerHTML = `<div class="skeleton skeleton-timeline-item" style="height:80px; width:100%;"></div>`;
    elements.cardsInProgress.innerHTML = `<div class="skeleton skeleton-timeline-item" style="height:80px; width:100%;"></div>`;
    elements.cardsDone.innerHTML = `<div class="skeleton skeleton-timeline-item" style="height:80px; width:100%;"></div>`;
    elements.directoryTableBody.innerHTML = `
      <tr class="skeleton-row-wrapper"><td colspan="5"><div class="skeleton skeleton-row"></div></td></tr>
      <tr class="skeleton-row-wrapper"><td colspan="5"><div class="skeleton skeleton-row"></div></td></tr>
    `;
  }
}

function updateSyncStatus(text, dotColor) {
  if (elements.syncText) elements.syncText.textContent = text;
  if (elements.pulseDot) {
    elements.pulseDot.className = `pulse-dot ${dotColor}`;
  }
}

// --- Core Rendering Dispatch ---
function renderApp() {
  calculateStats();
  renderTimelineView();
  renderKanbanView();
  renderDirectoryView();
  lucide.createIcons(); // Hydrate newly generated icons
}

// --- Calculations & Dashboard Stats ---
function calculateStats() {
  let completed = 0;
  let inProgress = 0;
  let todo = 0;
  let overdue = 0;
  
  state.tasks.forEach(task => {
    if (task.status === 'Done') completed++;
    else if (task.status === 'In progress') inProgress++;
    else if (task.status === 'To-do') todo++;
    
    if (isDateOverdue(task.due_date, task.status)) overdue++;
  });
  
  if (elements.statCompleted) elements.statCompleted.textContent = completed;
  if (elements.statInProgress) elements.statInProgress.textContent = inProgress;
  if (elements.statTodo) elements.statTodo.textContent = todo;
  if (elements.statOverdue) elements.statOverdue.textContent = overdue;
  
  if (elements.overdueCard) {
    if (overdue > 0) {
      elements.overdueCard.classList.add('has-overdue');
    } else {
      elements.overdueCard.classList.remove('has-overdue');
    }
  }
}

// --- View 1: Timeline Rendering ---
function renderTimelineView() {
  const container = elements.timelineItemsContainer;
  if (!container) return;
  
  // Sort tasks chronologically by due date (items with no date go to the end)
  const sortedTasks = [...state.tasks].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });
  
  if (sortedTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="compass" class="empty-icon"></i>
        <h4>No goals found</h4>
        <p>Click "New Goal" to add one to your Craft docs.</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  // Determine "Current Focus" (first in-progress or to-do task with a due date)
  let foundFocus = false;
  
  sortedTasks.forEach(task => {
    const isOverdue = isDateOverdue(task.due_date, task.status);
    let statusClass = task.status.toLowerCase().replace(' ', '-');
    if (isOverdue) statusClass = 'overdue';
    
    let isCurrentFocus = false;
    if (!foundFocus && task.status !== 'Done' && task.due_date) {
      isCurrentFocus = true;
      foundFocus = true;
    }
    
    let nodeIcon = 'circle';
    if (task.status === 'Done') nodeIcon = 'check';
    else if (isOverdue) nodeIcon = 'alert-triangle';
    else if (task.status === 'In progress') nodeIcon = 'trending-up';
    
    html += `
      <div class="timeline-item ${statusClass}" onclick="openEditModal('${task.id}')">
        <div class="timeline-node-wrapper">
          <div class="timeline-node" title="Status: ${task.status}">
            <i data-lucide="${nodeIcon}"></i>
          </div>
        </div>
        <div class="timeline-card">
          <div class="timeline-card-header">
            <h4 class="timeline-card-title">${escapeHTML(task.title)}</h4>
            <span class="status-badge ${statusClass}">
              ${isOverdue ? 'Overdue' : task.status}
            </span>
          </div>
          
          <div class="timeline-card-dates">
            ${task.due_date ? `
              <div class="date-indicator ${isOverdue ? 'overdue-text' : ''}">
                <i data-lucide="calendar"></i>
                <span>Due: ${formatDateFriendly(task.due_date)}</span>
              </div>
            ` : ''}
            ${task.take_action ? `
              <div class="date-indicator">
                <i data-lucide="calendar-clock"></i>
                <span>Action: ${formatDateFriendly(task.take_action)}</span>
              </div>
            ` : ''}
            ${!task.due_date && !task.take_action ? `
              <div class="date-indicator text-muted">
                <i data-lucide="help-circle"></i>
                <span>No timeframe set</span>
              </div>
            ` : ''}
          </div>
          
          ${isCurrentFocus ? `
            <div style="margin-top: 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 0.75rem; font-weight: 700; color: var(--accent); background: rgba(var(--accent-hue), 85%, 10%); border: 1px dashed var(--accent); padding: 2px 8px; border-radius: var(--radius-sm);">
              <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> CURRENT FOCUS
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// --- View 2: Kanban Board Rendering ---
function renderKanbanView() {
  const cols = {
    'To-do': { container: elements.cardsTodo, countEl: elements.countColTodo, html: '' },
    'In progress': { container: elements.cardsInProgress, countEl: elements.countColInProgress, html: '' },
    'Done': { container: elements.cardsDone, countEl: elements.countColDone, html: '' }
  };
  
  // Clear counts
  let counts = { 'To-do': 0, 'In progress': 0, 'Done': 0 };
  
  state.tasks.forEach(task => {
    const status = task.status;
    if (!cols[status]) return;
    
    counts[status]++;
    const isOverdue = isDateOverdue(task.due_date, task.status);
    
    // Quick-shift action buttons
    let actionButtons = '';
    if (status === 'To-do') {
      actionButtons = `
        <button class="kanban-action-btn" title="Start Goal" onclick="event.stopPropagation(); shiftTaskStatus('${task.id}', 'In progress')">
          <i data-lucide="arrow-right"></i>
        </button>
      `;
    } else if (status === 'In progress') {
      actionButtons = `
        <button class="kanban-action-btn" title="Back to To-Do" onclick="event.stopPropagation(); shiftTaskStatus('${task.id}', 'To-do')">
          <i data-lucide="arrow-left"></i>
        </button>
        <button class="kanban-action-btn" title="Complete Goal" onclick="event.stopPropagation(); shiftTaskStatus('${task.id}', 'Done')">
          <i data-lucide="check"></i>
        </button>
      `;
    } else if (status === 'Done') {
      actionButtons = `
        <button class="kanban-action-btn" title="Reopen Goal" onclick="event.stopPropagation(); shiftTaskStatus('${task.id}', 'In progress')">
          <i data-lucide="arrow-left"></i>
        </button>
      `;
    }
    
    cols[status].html += `
      <div class="kanban-card" onclick="openEditModal('${task.id}')">
        <h4>${escapeHTML(task.title)}</h4>
        
        <div class="kanban-card-meta">
          <div class="kanban-card-date ${isOverdue ? 'overdue-text' : ''}">
            ${task.due_date ? `
              <i data-lucide="calendar"></i>
              <span>${formatDateFriendly(task.due_date)}</span>
            ` : `
              <i data-lucide="clock" class="text-muted"></i>
              <span class="text-muted">Undated</span>
            `}
          </div>
          <div class="kanban-actions">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
  });
  
  // Render and update counts
  Object.keys(cols).forEach(status => {
    cols[status].countEl.textContent = counts[status];
    if (counts[status] === 0) {
      cols[status].container.innerHTML = `
        <div class="empty-state" style="padding: 30px 10px;">
          <p class="text-muted" style="font-size:0.8125rem;">No tasks in this column</p>
        </div>
      `;
    } else {
      cols[status].container.innerHTML = cols[status].html;
    }
  });
}

// --- Quick Status Updates ---
async function shiftTaskStatus(id, newStatus) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  
  // Optimistic update locally
  task.status = newStatus;
  renderApp();
  
  // Trigger remote API update
  const properties = {
    status: newStatus,
    due_date: task.due_date || '',
    take_action: task.take_action || ''
  };
  
  updateSyncStatus('Syncing Status...', 'yellow');
  await apiUpdateTask(id, task.title, properties);
}

// --- View 3: Task Directory Rendering ---
function renderDirectoryView() {
  const tableBody = elements.directoryTableBody;
  if (!tableBody) return;
  
  // Apply Search and Filters
  let filteredTasks = state.tasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = state.statusFilter === 'all' || task.status === state.statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (state.dateFilter === 'overdue') {
      matchesDate = isDateOverdue(task.due_date, task.status);
    } else if (state.dateFilter === 'has-date') {
      matchesDate = !!(task.due_date || task.take_action);
    } else if (state.dateFilter === 'no-date') {
      matchesDate = !(task.due_date || task.take_action);
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  // Sort
  filteredTasks.sort((a, b) => {
    let valA = a[state.sortField] || '';
    let valB = b[state.sortField] || '';
    
    // Custom sort values logic
    if (state.sortField === 'due_date' || state.sortField === 'take_action') {
      // Empty dates go to the bottom
      if (!valA) return 1;
      if (!valB) return -1;
    }
    
    let comparison = valA.localeCompare(valB);
    return state.sortAsc ? comparison : -comparison;
  });
  
  // Empty State Toggle
  if (filteredTasks.length === 0) {
    tableBody.innerHTML = '';
    elements.tableEmptyState.style.display = 'flex';
    return;
  }
  
  elements.tableEmptyState.style.display = 'none';
  
  let html = '';
  filteredTasks.forEach(task => {
    const isOverdue = isDateOverdue(task.due_date, task.status);
    let statusClass = task.status.toLowerCase().replace(' ', '-');
    if (isOverdue) statusClass = 'overdue';
    
    html += `
      <tr>
        <td>
          <div class="table-title-cell">${escapeHTML(task.title)}</div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">
            ${isOverdue ? 'Overdue' : task.status}
          </span>
        </td>
        <td class="${isOverdue ? 'overdue-text' : ''}">
          ${task.due_date ? formatDateFriendly(task.due_date) : '<span class="text-muted">-</span>'}
        </td>
        <td>
          ${task.take_action ? formatDateFriendly(task.take_action) : '<span class="text-muted">-</span>'}
        </td>
        <td>
          <div class="table-ops-cell">
            <button class="table-btn" title="Edit Goal" onclick="openEditModal('${task.id}')">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="table-btn danger-text" title="Delete Goal" onclick="deleteTaskDirect('${task.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  tableBody.innerHTML = html;
}

// --- Modal Management ---
function openCreateModal() {
  elements.modalTitle.textContent = 'Add New Goal';
  elements.taskForm.reset();
  elements.editTaskId.value = '';
  elements.deleteTaskBtn.style.display = 'none';
  elements.titleError.classList.remove('active');
  elements.taskModal.classList.add('active');
  elements.taskTitleInput.focus();
}

function openEditModal(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  
  elements.modalTitle.textContent = 'Edit Goal';
  elements.editTaskId.value = task.id;
  elements.taskTitleInput.value = task.title;
  elements.taskStatusInput.value = task.status;
  elements.taskDueDateInput.value = task.due_date;
  elements.taskActionDateInput.value = task.take_action;
  
  elements.deleteTaskBtn.style.display = 'inline-flex';
  elements.titleError.classList.remove('active');
  elements.taskModal.classList.add('active');
  elements.taskTitleInput.focus();
}

function closeModal() {
  elements.taskModal.classList.remove('active');
}

// --- Submit Dialog Form ---
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = elements.editTaskId.value;
  const title = elements.taskTitleInput.value.trim();
  const status = elements.taskStatusInput.value;
  const due_date = elements.taskDueDateInput.value;
  const take_action = elements.taskActionDateInput.value;
  
  // Validation
  if (!title) {
    elements.titleError.classList.add('active');
    elements.taskTitleInput.focus();
    return;
  }
  
  closeModal();
  setLoadingState(true);
  
  const properties = { status, due_date, take_action };
  
  if (id) {
    // Edit existing goal
    await apiUpdateTask(id, title, properties);
  } else {
    // Create new goal
    await apiCreateTask(title, properties);
  }
}

// --- Deletions ---
async function deleteTaskDirect(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  
  if (confirm(`Are you sure you want to delete the goal "${task.title}"?`)) {
    setLoadingState(true);
    await apiDeleteTask(id);
  }
}

async function handleDeleteBtnClick() {
  const id = elements.editTaskId.value;
  if (!id) return;
  
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  
  if (confirm(`Are you sure you want to delete the goal "${task.title}"?`)) {
    closeModal();
    setLoadingState(true);
    await apiDeleteTask(id);
  }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Theme toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Sync Badge Click (manual refresh)
  elements.syncBadge.addEventListener('click', () => {
    if (!state.loading) {
      showToast('Refreshing data from Craft docs...', 'info');
      fetchTasks();
    }
  });
  
  // Tabs Navigation
  elements.navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const selectedTab = e.currentTarget.getAttribute('data-tab');
      
      // Update active tab buttons
      elements.navTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      // Update active panel
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      if (selectedTab === 'timeline') elements.viewTimeline.classList.add('active');
      else if (selectedTab === 'kanban') elements.viewKanban.classList.add('active');
      else if (selectedTab === 'directory') elements.viewDirectory.classList.add('active');
      
      state.currentTab = selectedTab;
      lucide.createIcons(); // Hydrate any loaded icons
    });
  });
  
  // Dashboard card status filters
  document.querySelectorAll('.mini-stat-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const statusFilterVal = e.currentTarget.getAttribute('data-status-filter');
      const isOverdueFilter = e.currentTarget.id === 'overdueCard';
      
      // Switch tab to Directory
      const directoryTab = document.querySelector('.nav-tab[data-tab="directory"]');
      if (directoryTab) directoryTab.click();
      
      // Apply filters
      if (isOverdueFilter) {
        elements.statusFilterSelect.value = 'all';
        elements.dateFilterSelect.value = 'overdue';
        state.statusFilter = 'all';
        state.dateFilter = 'overdue';
      } else if (statusFilterVal) {
        elements.statusFilterSelect.value = statusFilterVal;
        elements.dateFilterSelect.value = 'all';
        state.statusFilter = statusFilterVal;
        state.dateFilter = 'all';
      }
      
      renderDirectoryView();
      lucide.createIcons();
    });
  });
  
  // Modal Buttons
  document.querySelectorAll('.btn-new-task').forEach(btn => {
    btn.addEventListener('click', openCreateModal);
  });
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.cancelModalBtn.addEventListener('click', closeModal);
  elements.deleteTaskBtn.addEventListener('click', handleDeleteBtnClick);
  elements.taskForm.addEventListener('submit', handleFormSubmit);
  
  // Close modal on overlay click
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) closeModal();
  });
  
  // Directory Search and Filters
  elements.taskSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    
    // Toggle clear search button visibility
    if (state.searchQuery) {
      elements.clearSearchBtn.style.display = 'flex';
    } else {
      elements.clearSearchBtn.style.display = 'none';
    }
    
    renderDirectoryView();
    lucide.createIcons();
  });
  
  elements.clearSearchBtn.addEventListener('click', () => {
    elements.taskSearchInput.value = '';
    state.searchQuery = '';
    elements.clearSearchBtn.style.display = 'none';
    renderDirectoryView();
    lucide.createIcons();
  });
  
  elements.statusFilterSelect.addEventListener('change', (e) => {
    state.statusFilter = e.target.value;
    renderDirectoryView();
    lucide.createIcons();
  });
  
  elements.dateFilterSelect.addEventListener('change', (e) => {
    state.dateFilter = e.target.value;
    renderDirectoryView();
    lucide.createIcons();
  });
  
  // Table Sorting Headers
  elements.tableHeaders.forEach(th => {
    th.addEventListener('click', (e) => {
      const field = e.currentTarget.getAttribute('data-sort');
      
      if (state.sortField === field) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortField = field;
        state.sortAsc = true;
      }
      
      // Update sort icons
      elements.tableHeaders.forEach(h => {
        const icon = h.querySelector('.sort-icon');
        if (icon) {
          icon.setAttribute('data-lucide', 'chevrons-up-down');
        }
      });
      
      const currentIcon = e.currentTarget.querySelector('.sort-icon');
      if (currentIcon) {
        currentIcon.setAttribute('data-lucide', state.sortAsc ? 'chevron-up' : 'chevron-down');
      }
      
      renderDirectoryView();
      lucide.createIcons();
    });
  });
}

// --- Toast Notification Utilities ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check-circle';
  else if (type === 'error') iconName = 'alert-triangle';
  
  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span class="toast-message">${escapeHTML(message)}</span>
    <div class="toast-progress"></div>
  `;
  
  elements.toastContainer.appendChild(toast);
  lucide.createIcons(); // Hydrate the icon
  
  // Slide out after 4 seconds (matching animation duration)
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// --- Helper Functions ---
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
