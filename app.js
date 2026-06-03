/* ==========================================================================
   Our Life Progress Tracker - Application Logic
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
    
    // Concentric Radial Progress elements
    yearProgressCircle: document.getElementById('yearProgressCircle'),
    yearProgressPercent: document.getElementById('yearProgressPercent'),
    monthProgressCircle: document.getElementById('monthProgressCircle'),
    monthProgressPercent: document.getElementById('monthProgressPercent'),
    weekProgressCircle: document.getElementById('weekProgressCircle'),
    weekProgressPercent: document.getElementById('weekProgressPercent'),
    dayProgressCircle: document.getElementById('dayProgressCircle'),
    dayProgressPercent: document.getElementById('dayProgressPercent'),
    progressMatrixDesc: document.getElementById('progressMatrixDesc'),
    
    // Assignee stats count
    statMg: document.getElementById('statMg'),
    statChitLay: document.getElementById('statChitLay'),
    statShared: document.getElementById('statShared'),
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
    taskAssigneeInput: document.getElementById('taskAssigneeInput'),
    taskDueDateInput: document.getElementById('taskDueDateInput'),
    taskActionDateInput: document.getElementById('taskActionDateInput'),
    titleError: document.getElementById('titleError'),
    deleteTaskBtn: document.getElementById('deleteTaskBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    
    // Sidebar
    upcomingCount: document.getElementById('upcomingCount'),
    upcomingFeedList: document.getElementById('upcomingFeedList'),
    motivationTitle: document.getElementById('motivationTitle'),
    motivationQuote: document.getElementById('motivationQuote'),
    
    // Toast Container
    toastContainer: document.getElementById('toastContainer'),
  };
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initDOMElements();
  initTheme();
  setupEventListeners();
  updateAllProgressMetrics();
  fetchTasks();
  
  // Re-run time calculations periodically
  setInterval(updateAllProgressMetrics, 30000);
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

// --- Radial Progress Render Utilities ---
function setRadialOffset(circleEl, percentEl, percentage, radius) {
  if (!circleEl) return;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  circleEl.style.strokeDashoffset = offset;
  
  if (percentEl) {
    percentEl.textContent = `${Math.round(percentage)}%`;
  }
}

// --- Dynamic Progress Metrics Calculations ---
function updateAllProgressMetrics() {
  const now = new Date();
  const year = now.getFullYear();
  
  // 1. Year Progress (radius = 55)
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
  const yearPercent = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;
  setRadialOffset(elements.yearProgressCircle, elements.yearProgressPercent, yearPercent, 55);
  
  const dayOfYear = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
  const totalDays = isLeapYear(year) ? 366 : 365;
  if (elements.progressMatrixDesc) {
    elements.progressMatrixDesc.textContent = `Day ${dayOfYear} of ${totalDays} in ${year}. Keep moving forward!`;
  }

  // 2. Month Progress (radius = 44)
  const month = now.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const monthPercent = ((now - startOfMonth) / (endOfMonth - startOfMonth)) * 100;
  setRadialOffset(elements.monthProgressCircle, elements.monthProgressPercent, monthPercent, 44);

  // 3. Week Progress (radius = 33)
  const dayOfWeek = now.getDay(); // 0 is Sunday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const weekPercent = ((now - startOfWeek) / (endOfWeek - startOfWeek)) * 100;
  setRadialOffset(elements.weekProgressCircle, elements.weekProgressPercent, weekPercent, 33);

  // 4. Day Progress (radius = 22)
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const dayPercent = ((now - startOfDay) / (endOfDay - startOfDay)) * 100;
  setRadialOffset(elements.dayProgressCircle, elements.dayProgressPercent, dayPercent, 22);
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

// --- Celebration Animation ---
function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.75 },
      colors: ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899']
    });
  }
}

// --- Assignee Helper Parsers ---
// Normalizes task title by stripping legacy bracket prefixes if present
function cleanTaskTitle(rawTitle) {
  const mgRegex = /^\[Mg\]\s*/i;
  const clRegex = /^\[Chit Lay\]\s*/i;
  let title = rawTitle || 'Untitled Goal';
  return title.replace(clRegex, '').replace(mgRegex, '');
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
    const fetchedTasks = data.items.map(item => {
      const cleanTitle = cleanTaskTitle(item.title);
      const role = item.properties.role || [];
      let assignee = 'Shared';
      if (role.length === 1) {
        if (role[0] === 'Mg') assignee = 'Mg';
        else if (role[0] === 'Chit Lay') assignee = 'Chit Lay';
      } else if (role.length > 1) {
        assignee = 'Shared';
      }
      return {
        id: item.id,
        title: cleanTitle,
        assignee: assignee,
        rawTitle: item.title || 'Untitled Goal',
        status: item.properties.status || 'To-do',
        due_date: item.properties.due_date || '',
        take_action: item.properties.take_action || '',
      };
    });
    
    // Sort tasks according to saved manual timeline order if exists
    const savedOrder = localStorage.getItem('timeline_order');
    if (savedOrder) {
      try {
        const orderArray = JSON.parse(savedOrder);
        const orderMap = new Map(orderArray.map((id, index) => [id, index]));
        fetchedTasks.sort((a, b) => {
          const hasA = orderMap.has(a.id);
          const hasB = orderMap.has(b.id);
          if (hasA && hasB) return orderMap.get(a.id) - orderMap.get(b.id);
          if (!hasA && hasB) return -1; // New items go to top
          if (hasA && !hasB) return 1;
          return 0;
        });
      } catch (e) {
        console.error('Failed to parse manual timeline order:', e);
      }
    }
    
    state.tasks = fetchedTasks;
    renderApp();
    updateSyncStatus('Synced with Craft', 'green');
  } catch (error) {
    console.error(error);
    showToast('Failed to load tasks from Craft docs', 'error');
    updateSyncStatus('Sync Error', 'yellow');
    renderApp(); // Clear loading block displays
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
    if (properties.status === 'Done') triggerConfetti();
    fetchTasks();
  } catch (error) {
    console.error(error);
    showToast('Error creating goal in Craft docs', 'error');
  }
}

async function apiUpdateTask(id, title, properties, suppressReload = false) {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${COLLECTION_ID}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemsToUpdate: [{ id, title, properties }]
      })
    });
    
    if (!response.ok) throw new Error('API update failed');
    if (!suppressReload) {
      showToast('Goal updated successfully', 'success');
      fetchTasks();
    }
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

// --- Loading skeleton states ---
function setLoadingState(isLoading) {
  state.loading = isLoading;
  if (isLoading) {
    elements.timelineItemsContainer.innerHTML = `
      <div class="loading-placeholder">
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
    elements.upcomingFeedList.innerHTML = `<div class="skeleton skeleton-row" style="height:60px; margin-bottom:8px;"></div><div class="skeleton skeleton-row" style="height:60px;"></div>`;
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
  renderSidebarWidgets();
  lucide.createIcons(); // Hydrate newly generated icons
}

// --- Calculations & Dashboard Stats ---
function calculateStats() {
  let mgCount = 0;
  let clCount = 0;
  let sharedCount = 0;
  let overdue = 0;
  
  state.tasks.forEach(task => {
    if (task.assignee === 'Mg') mgCount++;
    else if (task.assignee === 'Chit Lay') clCount++;
    else sharedCount++;
    
    if (isDateOverdue(task.due_date, task.status)) overdue++;
  });
  
  if (elements.statMg) elements.statMg.textContent = mgCount;
  if (elements.statChitLay) elements.statChitLay.textContent = clCount;
  if (elements.statShared) elements.statShared.textContent = sharedCount;
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
  
  // Use tasks in their custom manual sorted order
  const sortedTasks = state.tasks;
  
  if (sortedTasks.length === 0) {
    const isLocalFile = window.location.protocol === 'file:';
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="compass" class="empty-icon"></i>
        <h4>No goals found</h4>
        ${isLocalFile ? `
          <p style="color: var(--danger-color); max-width: 500px; margin: 10px auto 0 auto; line-height: 1.4; font-size: 0.8125rem;">
            <strong>Warning: CORS policy block detected.</strong> You opened this file directly via <code>file://</code>. 
            API requests require a web server to function. Please run the server:
            <br><code style="background:var(--bg-primary); padding:3px 8px; border-radius:4px; display:inline-block; margin-top:8px;">python3 -m http.server 8000</code>
            and visit <a href="http://localhost:8000" target="_blank" style="color:var(--accent-light);">http://localhost:8000</a>.
          </p>
        ` : `
          <p>Click "New Goal" to add one to your Craft docs.</p>
        `}
      </div>
    `;
    return;
  }
  
  let html = '';
  let foundFocus = false;
  
  sortedTasks.forEach((task, index) => {
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
    
    // Assignee styling highlights
    let assigneeLabel = '';
    if (task.assignee === 'Mg') {
      assigneeLabel = `<span style="font-size: 0.6875rem; font-weight: 700; color: hsl(200, 85%, 52%); background: rgba(56, 189, 248, 0.08); padding: 2px 6px; border-radius: var(--radius-sm); margin-right: 6px;">Mg</span>`;
    } else if (task.assignee === 'Chit Lay') {
      assigneeLabel = `<span style="font-size: 0.6875rem; font-weight: 700; color: hsl(350, 85%, 65%); background: rgba(244, 63, 94, 0.08); padding: 2px 6px; border-radius: var(--radius-sm); margin-right: 6px;">Chit Lay</span>`;
    }
    
    const delay = index * 0.08;
    
    html += `
      <div class="timeline-item ${statusClass}" style="animation-delay: ${delay}s" draggable="true" data-id="${task.id}" onclick="if(!window.isDraggingTimeline) openEditModal('${task.id}')">
        <div class="timeline-node-wrapper">
          <div class="timeline-node" title="Click to toggle completion" onclick="event.stopPropagation(); toggleTaskCompleted('${task.id}')">
            <i data-lucide="${nodeIcon}"></i>
          </div>
        </div>
        <div class="timeline-card">
          <div class="timeline-card-header">
            <h4 class="timeline-card-title">${assigneeLabel}${escapeHTML(task.title)}</h4>
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
            <div style="margin-top: 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 700; color: var(--accent); background: rgba(124, 58, 237, 0.08); border: 1px dashed var(--accent); padding: 3px 8px; border-radius: var(--radius-sm);">
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
    
    // Assignee initials badge
    let initialsBadge = '';
    if (task.assignee === 'Mg') {
      initialsBadge = `<span style="font-size:0.625rem; font-weight:800; padding:2px 6px; border-radius:4px; color:hsl(200,85%,50%); background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2);">MG</span>`;
    } else if (task.assignee === 'Chit Lay') {
      initialsBadge = `<span style="font-size:0.625rem; font-weight:800; padding:2px 6px; border-radius:4px; color:hsl(350,85%,65%); background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.2);">CL</span>`;
    } else {
      initialsBadge = `<span style="font-size:0.625rem; font-weight:800; padding:2px 6px; border-radius:4px; color:var(--text-secondary); background:var(--bg-primary); border:1px solid var(--border-color);">BOTH</span>`;
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
          <div style="display:flex; align-items:center; gap:8px;">
            ${initialsBadge}
            <div class="kanban-actions">
              ${actionButtons}
            </div>
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

// --- Quick Status Shifters ---
async function shiftTaskStatus(id, newStatus) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  
  // Optimistic update locally
  task.status = newStatus;
  renderApp();
  
  if (newStatus === 'Done') {
    triggerConfetti();
    showToast(`Completed goal: "${task.title}"! 🎉`, 'success');
  }
  
  const properties = {
    status: newStatus,
    due_date: task.due_date || '',
    take_action: task.take_action || '',
    role: task.assignee === 'Shared' ? ['Mg', 'Chit Lay'] : [task.assignee]
  };
  
  updateSyncStatus('Syncing Status...', 'yellow');
  await apiUpdateTask(id, task.title, properties, true); // suppressReload = true for fast UI feedback
}

async function toggleTaskCompleted(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  
  const newStatus = task.status === 'Done' ? 'To-do' : 'Done';
  await shiftTaskStatus(id, newStatus);
  fetchTasks();
}

// --- View 3: Task Directory Rendering ---
function renderDirectoryView() {
  const tableBody = elements.directoryTableBody;
  if (!tableBody) return;
  
  let filteredTasks = state.tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(state.searchQuery.toLowerCase());
    const matchesStatus = state.statusFilter === 'all' || task.status === state.statusFilter;
    
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
  
  // Sorting
  filteredTasks.sort((a, b) => {
    let valA = a[state.sortField] || '';
    let valB = b[state.sortField] || '';
    
    if (state.sortField === 'due_date' || state.sortField === 'take_action') {
      if (!valA) return 1;
      if (!valB) return -1;
    }
    
    let comparison = valA.localeCompare(valB);
    return state.sortAsc ? comparison : -comparison;
  });
  
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
    
    let assigneeBadge = '';
    if (task.assignee === 'Mg') {
      assigneeBadge = `<span style="font-size:0.625rem; font-weight:800; padding:2px 6px; border-radius:4px; color:hsl(200,85%,50%); background:rgba(56,189,248,0.1);">Mg</span>`;
    } else if (task.assignee === 'Chit Lay') {
      assigneeBadge = `<span style="font-size:0.625rem; font-weight:800; padding:2px 6px; border-radius:4px; color:hsl(350,85%,65%); background:rgba(244,63,94,0.1);">Chit Lay</span>`;
    } else {
      assigneeBadge = `<span style="font-size:0.625rem; font-weight:800; padding:2px 6px; border-radius:4px; color:var(--text-secondary); background:var(--bg-tertiary);">Shared</span>`;
    }
    
    html += `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <button style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; padding:2px; transition:var(--transition-fast);" 
                    onclick="event.stopPropagation(); toggleTaskCompleted('${task.id}')"
                    title="${task.status === 'Done' ? 'Mark Incomplete' : 'Mark Complete'}">
              <i data-lucide="${task.status === 'Done' ? 'check-square' : 'square'}" 
                 style="width: 18px; height: 18px; color: ${task.status === 'Done' ? 'var(--done-color)' : 'var(--text-muted)'}"></i>
            </button>
            <div class="table-title-cell">${escapeHTML(task.title)}</div>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="status-badge ${statusClass}">${isOverdue ? 'Overdue' : task.status}</span>
            ${assigneeBadge}
          </div>
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

// --- Render Sidebar Widgets (Upcoming list & Motivation Quotes) ---
function renderSidebarWidgets() {
  // 1. Upcoming deadlines feed
  const upcomingListContainer = elements.upcomingFeedList;
  if (!upcomingListContainer) return;
  
  const upcomingTasks = state.tasks.filter(task => {
    return task.status !== 'Done' && (task.due_date || task.take_action);
  });
  
  upcomingTasks.sort((a, b) => {
    const dateA = a.due_date || a.take_action;
    const dateB = b.due_date || b.take_action;
    return dateA.localeCompare(dateB);
  });
  
  const topUpcoming = upcomingTasks.slice(0, 3);
  elements.upcomingCount.textContent = upcomingTasks.length;
  
  if (topUpcoming.length === 0) {
    upcomingListContainer.innerHTML = `
      <p class="text-muted text-center" style="font-size:0.8125rem; padding: 15px 0;">No active timeframes.</p>
    `;
  } else {
    let html = '';
    topUpcoming.forEach(task => {
      const isOverdue = isDateOverdue(task.due_date, task.status);
      const targetDate = task.due_date || task.take_action;
      const label = task.due_date ? 'Due' : 'Action';
      
      let assigneePrefix = '';
      if (task.assignee === 'Mg') assigneePrefix = `<span style="color:hsl(200,85%,50%); font-weight:700;">MG: </span>`;
      else if (task.assignee === 'Chit Lay') assigneePrefix = `<span style="color:hsl(350,85%,65%); font-weight:700;">CL: </span>`;
      
      html += `
        <div class="upcoming-item" onclick="openEditModal('${task.id}')">
          <div class="upcoming-info">
            <span class="upcoming-title">${assigneePrefix}${escapeHTML(task.title)}</span>
            <span class="upcoming-date ${isOverdue ? 'overdue' : ''}">
              <i data-lucide="calendar"></i>
              <span>${label}: ${formatDateFriendly(targetDate)}</span>
            </span>
          </div>
          <div class="upcoming-action-indicator">
            <i data-lucide="chevron-right" style="width:14px; height:14px;"></i>
          </div>
        </div>
      `;
    });
    upcomingListContainer.innerHTML = html;
  }
  
  // 2. Motivational Card Quote
  const totalGoals = state.tasks.length;
  const completedGoals = state.tasks.filter(t => t.status === 'Done').length;
  const rate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  
  let title = 'Set Your Focus';
  let quote = '"Small, consistent actions build outstanding accomplishments."';
  
  if (totalGoals === 0) {
    title = 'Start Your Journey';
    quote = '"The secret of getting ahead is getting started." — Mark Twain';
  } else if (rate === 100) {
    title = 'Outstanding Achiever!';
    quote = '"All goals achieved! Take time to appreciate your diligence." 🎉';
  } else if (rate >= 70) {
    title = 'Finishing Strong!';
    quote = '"Incredible momentum! You are nearing completion. Finish strong."';
  } else if (rate >= 40) {
    title = 'Excellent Progress!';
    quote = '"You\'re more than halfway there! Keep pushing your momentum."';
  } else if (rate > 0) {
    title = 'Solid Start!';
    quote = '"Good start! Every single step forward brings you closer."';
  }
  
  if (elements.motivationTitle) elements.motivationTitle.textContent = title;
  if (elements.motivationQuote) elements.motivationQuote.textContent = quote;
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
  elements.taskAssigneeInput.value = task.assignee;
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

// --- Form Submissions ---
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = elements.editTaskId.value;
  const title = elements.taskTitleInput.value.trim();
  const status = elements.taskStatusInput.value;
  const assignee = elements.taskAssigneeInput.value;
  const due_date = elements.taskDueDateInput.value;
  const take_action = elements.taskActionDateInput.value;
  
  if (!title) {
    elements.titleError.classList.add('active');
    elements.taskTitleInput.focus();
    return;
  }
  
  closeModal();
  setLoadingState(true);
  
  const properties = { 
    status, 
    due_date, 
    take_action,
    role: assignee === 'Shared' ? ['Mg', 'Chit Lay'] : [assignee]
  };
  
  if (id) {
    await apiUpdateTask(id, title, properties);
  } else {
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
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  
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
      
      elements.navTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
      if (selectedTab === 'timeline') elements.viewTimeline.classList.add('active');
      else if (selectedTab === 'kanban') elements.viewKanban.classList.add('active');
      else if (selectedTab === 'directory') elements.viewDirectory.classList.add('active');
      
      state.currentTab = selectedTab;
      lucide.createIcons();
    });
  });
  
  // Mini stat cards filter links (Assignee sorting & filtering)
  document.querySelectorAll('.mini-stat-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const assigneeFilterVal = e.currentTarget.getAttribute('data-assignee-filter');
      const isOverdueFilter = e.currentTarget.id === 'overdueCard';
      
      const directoryTab = document.querySelector('.nav-tab[data-tab="directory"]');
      if (directoryTab) directoryTab.click();
      
      if (isOverdueFilter) {
        elements.statusFilterSelect.value = 'all';
        elements.dateFilterSelect.value = 'overdue';
        state.statusFilter = 'all';
        state.dateFilter = 'overdue';
        state.searchQuery = '';
        elements.taskSearchInput.value = '';
      } else if (assigneeFilterVal) {
        elements.statusFilterSelect.value = 'all';
        elements.dateFilterSelect.value = 'all';
        state.statusFilter = 'all';
        state.dateFilter = 'all';
        
        // Simple search query mock to filter by assignee prefix
        if (assigneeFilterVal === 'Mg') {
          state.searchQuery = '';
          elements.taskSearchInput.value = '';
          // Filter tasks locally by assignee
          filteredTasksHandler('Mg');
          return;
        } else if (assigneeFilterVal === 'Chit Lay') {
          state.searchQuery = '';
          elements.taskSearchInput.value = '';
          filteredTasksHandler('Chit Lay');
          return;
        } else {
          state.searchQuery = '';
          elements.taskSearchInput.value = '';
          filteredTasksHandler('Shared');
          return;
        }
      }
      
      renderDirectoryView();
      lucide.createIcons();
    });
  });
  
  // Modal Actions
  document.querySelectorAll('.btn-new-task').forEach(btn => {
    btn.addEventListener('click', openCreateModal);
  });
  elements.closeModalBtn.addEventListener('click', closeModal);
  elements.cancelModalBtn.addEventListener('click', closeModal);
  elements.deleteTaskBtn.addEventListener('click', handleDeleteBtnClick);
  elements.taskForm.addEventListener('submit', handleFormSubmit);
  
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) closeModal();
  });
  
  // Directory Search & Filters
  elements.taskSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    
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
  
  // Table Sorting
  elements.tableHeaders.forEach(th => {
    th.addEventListener('click', (e) => {
      const field = e.currentTarget.getAttribute('data-sort');
      
      if (state.sortField === field) {
        state.sortAsc = !state.sortAsc;
      } else {
        state.sortField = field;
        state.sortAsc = true;
      }
      
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

  // Timeline Drag & Drop manual sorting
  const timelineContainer = elements.timelineItemsContainer;
  if (timelineContainer) {
    timelineContainer.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.timeline-item');
      if (!item) return;
      window.isDraggingTimeline = true;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.getAttribute('data-id'));
    });
    
    timelineContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingEl = timelineContainer.querySelector('.timeline-item.dragging');
      const targetEl = e.target.closest('.timeline-item');
      if (draggingEl && targetEl && draggingEl !== targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
        timelineContainer.insertBefore(draggingEl, next ? targetEl.nextSibling : targetEl);
      }
    });

    timelineContainer.addEventListener('dragend', (e) => {
      const item = e.target.closest('.timeline-item');
      if (item) {
        item.classList.remove('dragging');
      }
      saveManualOrder();
      setTimeout(() => {
        window.isDraggingTimeline = false;
      }, 100);
    });
  }
}

function saveManualOrder() {
  const timelineItemsContainer = document.getElementById('timelineItemsContainer');
  if (!timelineItemsContainer) return;
  const itemEls = timelineItemsContainer.querySelectorAll('.timeline-item');
  const order = Array.from(itemEls).map(el => el.getAttribute('data-id')).filter(Boolean);
  localStorage.setItem('timeline_order', JSON.stringify(order));
  
  // Re-sort state.tasks to match the new manual order
  const orderMap = new Map(order.map((id, index) => [id, index]));
  state.tasks.sort((a, b) => {
    const hasA = orderMap.has(a.id);
    const hasB = orderMap.has(b.id);
    if (hasA && hasB) {
      return orderMap.get(a.id) - orderMap.get(b.id);
    }
    if (!hasA && hasB) return -1;
    if (hasA && !hasB) return 1;
    return 0;
  });
  
  renderApp();
}

// Custom handler for filtering directory list when stats card is clicked
function filteredTasksHandler(assignee) {
  const tableBody = elements.directoryTableBody;
  if (!tableBody) return;
  
  let filtered = state.tasks.filter(t => t.assignee === assignee);
  
  if (filtered.length === 0) {
    tableBody.innerHTML = '';
    elements.tableEmptyState.style.display = 'flex';
    return;
  }
  
  elements.tableEmptyState.style.display = 'none';
  
  let html = '';
  filtered.forEach(task => {
    const isOverdue = isDateOverdue(task.due_date, task.status);
    let statusClass = task.status.toLowerCase().replace(' ', '-');
    if (isOverdue) statusClass = 'overdue';
    
    let assigneeBadge = `<span style="font-size:0.625rem; font-weight:800; padding:2px 6px; border-radius:4px; color:${assignee === 'Mg' ? 'hsl(200,85%,50%)' : 'hsl(350,85%,65%)'}; background:${assignee === 'Mg' ? 'rgba(56,189,248,0.1)' : 'rgba(244,63,94,0.1)'};">${assignee}</span>`;
    if (assignee === 'Shared') {
      assigneeBadge = `<span style="font-size:0.625rem; font-weight:800; padding:2px 6px; border-radius:4px; color:var(--text-secondary); background:var(--bg-tertiary);">Shared</span>`;
    }
    
    html += `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <button style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; padding:2px; transition:var(--transition-fast);" 
                    onclick="event.stopPropagation(); toggleTaskCompleted('${task.id}')"
                    title="${task.status === 'Done' ? 'Mark Incomplete' : 'Mark Complete'}">
              <i data-lucide="${task.status === 'Done' ? 'check-square' : 'square'}" 
                 style="width: 18px; height: 18px; color: ${task.status === 'Done' ? 'var(--done-color)' : 'var(--text-muted)'}"></i>
            </button>
            <div class="table-title-cell">${escapeHTML(task.title)}</div>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="status-badge ${statusClass}">${isOverdue ? 'Overdue' : task.status}</span>
            ${assigneeBadge}
          </div>
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
  lucide.createIcons();
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
  
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// --- Helpers ---
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
