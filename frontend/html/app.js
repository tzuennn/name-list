const listEl = document.getElementById('list');
const inputEl = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const errorEl = document.getElementById('error');
const liveEl = document.getElementById('live');
const sortStatusEl = document.getElementById('sort-status');
const pageStatusEl = document.getElementById('page-status');
const paginationInfoEl = document.getElementById('pagination-info');
const pageNumbersEl = document.getElementById('page-numbers');
const pagePrevBtn = document.getElementById('page-prev');
const pageNextBtn = document.getElementById('page-next');

// Sorting state and controls
let currentData = [];
let currentSortMode = 'name-asc'; // Default sort mode

const sortButtons = {
  'name-asc': document.getElementById('sort-name-asc'),
  'name-desc': document.getElementById('sort-name-desc'),
  'date-newest': document.getElementById('sort-date-newest'),
  'date-oldest': document.getElementById('sort-date-oldest')
};

// Pagination state
let currentPage = 1;
let pageSize = 10;
let totalItems = 0;
let totalPages = 0;

function announce(msg) {
  if (!liveEl) return;
  liveEl.textContent = msg;
}

function announceSortChange(msg) {
  if (!sortStatusEl) return;
  sortStatusEl.textContent = msg;
}

function announcePageChange(msg) {
  if (!pageStatusEl) return;
  pageStatusEl.textContent = msg;
}

function setError(msg) {
  errorEl.textContent = msg || '';
  if (msg) announce(msg);
}

function timeit(label, fn) {
  const t0 = performance.now();
  return Promise.resolve(fn()).finally(() => {
    const t1 = performance.now();
    // Optional: console.debug timings
    // console.debug(`${label}: ${(t1 - t0).toFixed(1)}ms`);
  });
}

// Pagination utility functions
function calculatePagination(totalItems, pageSize, currentPage) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  
  return {
    totalPages,
    currentPage: safePage,
    startIndex,
    endIndex,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1
  };
}

function getPagedData(data, pageInfo) {
  if (!Array.isArray(data)) return [];
  return data.slice(pageInfo.startIndex, pageInfo.endIndex);
}

function updatePaginationInfo(pageInfo, totalItems) {
  if (!paginationInfoEl) return;
  
  if (totalItems === 0) {
    paginationInfoEl.textContent = 'No items to display';
    return;
  }
  
  const start = pageInfo.startIndex + 1;
  const end = pageInfo.endIndex;
  paginationInfoEl.textContent = `Showing ${start}-${end} of ${totalItems} items`;
}

function generatePageNumbers(pageInfo) {
  if (!pageNumbersEl) return;
  
  pageNumbersEl.innerHTML = '';
  
  const { currentPage, totalPages } = pageInfo;
  
  // Calculate which page numbers to show
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);
  
  // Adjust range to always show 5 pages when possible
  if (endPage - startPage < 4) {
    if (startPage === 1) {
      endPage = Math.min(totalPages, startPage + 4);
    } else if (endPage === totalPages) {
      startPage = Math.max(1, endPage - 4);
    }
  }
  
  // Add first page and ellipsis if needed
  if (startPage > 1) {
    addPageButton(1, 1 === currentPage);
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.style.padding = '0.5rem';
      ellipsis.style.color = '#666';
      pageNumbersEl.appendChild(ellipsis);
    }
  }
  
  // Add page number buttons
  for (let i = startPage; i <= endPage; i++) {
    addPageButton(i, i === currentPage);
  }
  
  // Add last page and ellipsis if needed
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.style.padding = '0.5rem';
      ellipsis.style.color = '#666';
      pageNumbersEl.appendChild(ellipsis);
    }
    addPageButton(totalPages, totalPages === currentPage);
  }
}

function addPageButton(pageNum, isCurrent) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pagination-btn';
  button.textContent = pageNum;
  
  if (isCurrent) {
    button.setAttribute('aria-current', 'page');
    button.setAttribute('aria-label', `Page ${pageNum}, current page`);
  } else {
    button.setAttribute('aria-label', `Go to page ${pageNum}`);
    button.addEventListener('click', () => goToPage(pageNum));
  }
  
  pageNumbersEl.appendChild(button);
}

function updatePaginationControls(pageInfo) {
  // Update prev/next buttons
  if (pagePrevBtn) {
    pagePrevBtn.disabled = !pageInfo.hasPrev;
    pagePrevBtn.setAttribute('aria-label', 
      pageInfo.hasPrev ? 'Go to previous page' : 'No previous page available');
  }
  
  if (pageNextBtn) {
    pageNextBtn.disabled = !pageInfo.hasNext;
    pageNextBtn.setAttribute('aria-label', 
      pageInfo.hasNext ? 'Go to next page' : 'No next page available');
  }
  
  // Generate page numbers
  generatePageNumbers(pageInfo);
  
  // Update pagination info
  updatePaginationInfo(pageInfo, totalItems);
}

function goToPage(newPage) {
  const pageInfo = calculatePagination(totalItems, pageSize, newPage);
  currentPage = pageInfo.currentPage;
  
  // Re-render with pagination
  const sortedData = sortNames(currentData, currentSortMode);
  const pagedData = getPagedData(sortedData, pageInfo);
  renderList(pagedData);
  
  // Update pagination controls
  updatePaginationControls(pageInfo);
  
  // Announce page change
  const message = `Page ${currentPage} of ${pageInfo.totalPages}`;
  announcePageChange(message);
}

function setPageSize(newSize) {
  pageSize = newSize;
  currentPage = 1; // Reset to first page when changing page size
  
  // Update page size button states
  document.querySelectorAll('.page-size-btn').forEach(btn => {
    const size = parseInt(btn.getAttribute('data-size'));
    if (size === newSize) {
      btn.classList.add('active');
      btn.setAttribute('aria-label', `Show ${size} items per page, currently active`);
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-label', `Show ${size} items per page`);
    }
  });
  
  // Re-render with new page size
  const sortedData = sortNames(currentData, currentSortMode);
  const pageInfo = calculatePagination(totalItems, pageSize, currentPage);
  const pagedData = getPagedData(sortedData, pageInfo);
  renderList(pagedData);
  updatePaginationControls(pageInfo);
  
  // Announce change
  announcePageChange(`Page size changed to ${newSize} items per page`);
}

// Sorting utility functions
function sortNames(items, mode) {
  if (!Array.isArray(items)) return [];
  
  const sorted = [...items]; // Create copy to avoid mutating original
  
  switch (mode) {
    case 'name-asc':
      return sorted.sort((a, b) => {
        if (!a.name || !b.name) return 0;
        return a.name.localeCompare(b.name, undefined, { 
          sensitivity: 'base',
          numeric: true,
          caseFirst: 'lower'
        });
      });
      
    case 'name-desc':
      return sorted.sort((a, b) => {
        if (!a.name || !b.name) return 0;
        return b.name.localeCompare(a.name, undefined, { 
          sensitivity: 'base',
          numeric: true,
          caseFirst: 'lower'
        });
      });
      
    case 'date-newest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
      
    case 'date-oldest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateA.getTime() - dateB.getTime(); // Oldest first
      });
      
    default:
      return sorted;
  }
}

function setSortMode(newMode) {
  if (currentSortMode === newMode) return; // No change needed
  
  currentSortMode = newMode;
  currentPage = 1; // Reset to first page when sorting changes
  
  // Update button states
  Object.keys(sortButtons).forEach(mode => {
    const button = sortButtons[mode];
    if (button) {
      const isActive = mode === newMode;
      button.setAttribute('aria-pressed', isActive.toString());
      
      // Update aria-label to include current state
      const baseLabel = button.getAttribute('aria-label').replace(/, currently active/g, '');
      const newLabel = isActive ? `${baseLabel}, currently active` : baseLabel;
      button.setAttribute('aria-label', newLabel);
    }
  });
  
  // Sort and re-render with pagination
  const sortedData = sortNames(currentData, newMode);
  const pageInfo = calculatePagination(totalItems, pageSize, currentPage);
  const pagedData = getPagedData(sortedData, pageInfo);
  renderList(pagedData);
  updatePaginationControls(pageInfo);
  
  // Announce the change
  const sortMessages = {
    'name-asc': 'Names sorted alphabetically A to Z',
    'name-desc': 'Names sorted alphabetically Z to A', 
    'date-newest': 'Names sorted by newest entries first',
    'date-oldest': 'Names sorted by oldest entries first'
  };
  
  const message = sortMessages[newMode] || 'Sort order changed';
  announceSortChange(message);
}

async function fetchNames() {
  setError('');
  return timeit('fetchNames', async () => {
    try {
      const res = await fetch('/api/names');
      const data = await res.json();
      currentData = data; // Store the data for sorting
      totalItems = data.length;
      
      // Calculate pagination and render
      const sortedData = sortNames(data, currentSortMode);
      const pageInfo = calculatePagination(totalItems, pageSize, currentPage);
      const pagedData = getPagedData(sortedData, pageInfo);
      
      renderList(pagedData);
      updatePaginationControls(pageInfo);
    } catch (e) {
      setError('Failed to load names.');
    }
  });
}

function renderList(items) {
  listEl.innerHTML = '';
  if (items.length === 0) {
    listEl.innerHTML = '<li style="color: #666; font-style: italic;">No names yet</li>';
    return;
  }

  items.forEach((row, index) => {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = `${index + 1}. ${row.name}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.onclick = () => removeName(row.id);
    deleteBtn.setAttribute('aria-label', `Delete ${row.name}`);
    deleteBtn.title = `Delete ${row.name}`;

    li.appendChild(nameSpan);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  });
}

async function addName() {
  const name = (inputEl.value || '').trim();
  if (!name) {
    setError('Name cannot be empty.');
    inputEl.focus();
    return;
  }
  setError('');
  try {
    const res = await fetch('/api/names', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Failed to add name.');
      return;
    }
    inputEl.value = '';
    announce('Name added.');
    fetchNames();
  } catch (e) {
    setError('Failed to add name.');
  }
}

async function removeName(id) {
  setError('');
  try {
    const res = await fetch(`/api/names/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('Failed to delete.');
      return;
    }
    announce('Name deleted.');
    fetchNames();
  } catch (e) {
    setError('Failed to delete.');
  }
}

inputEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addName();
});

addBtn.onclick = addName;

// Add sorting button event listeners
Object.keys(sortButtons).forEach(mode => {
  const button = sortButtons[mode];
  if (button) {
    button.addEventListener('click', () => setSortMode(mode));
    
    // Add keyboard support for Enter and Space
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setSortMode(mode);
      }
    });
  }
});

// Add pagination event listeners
if (pagePrevBtn) {
  pagePrevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  });
}

if (pageNextBtn) {
  pageNextBtn.addEventListener('click', () => {
    const pageInfo = calculatePagination(totalItems, pageSize, currentPage);
    if (currentPage < pageInfo.totalPages) {
      goToPage(currentPage + 1);
    }
  });
}

// Add page size control event listeners
document.querySelectorAll('.page-size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const newSize = parseInt(btn.getAttribute('data-size'));
    if (newSize && newSize !== pageSize) {
      setPageSize(newSize);
    }
  });
});

// Add keyboard navigation for pagination
document.addEventListener('keydown', (e) => {
  // Only handle if focus is not in an input field
  if (document.activeElement.tagName === 'INPUT') return;
  
  if (e.key === 'ArrowLeft' && e.ctrlKey) {
    e.preventDefault();
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  } else if (e.key === 'ArrowRight' && e.ctrlKey) {
    e.preventDefault();
    const pageInfo = calculatePagination(totalItems, pageSize, currentPage);
    if (currentPage < pageInfo.totalPages) {
      goToPage(currentPage + 1);
    }
  }
});

fetchNames();
