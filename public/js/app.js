import { fetchStories, fetchStory } from './api.js';
import { renderStories, showLoading, showError, openModal, closeModal } from './ui.js';

const state = {
  type: 'top',
  stories: [],
  query: '',
};

const storyList = document.getElementById('story-list');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const statusBar = document.getElementById('status-bar');
const tabButtons = document.querySelectorAll('.tab-btn');
const dateline = document.getElementById('dateline');

function setDateline() {
  if (!dateline) return;
  const now = new Date();
  dateline.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function syncSearchClear() {
  if (!searchClear) return;
  searchClear.hidden = !searchInput.value.trim();
}

function clearSearch() {
  searchInput.value = '';
  state.query = '';
  syncSearchClear();
  updateListView();
  searchInput.focus();
}

function getFilteredStories() {
  if (!state.query.trim()) {
    return state.stories;
  }

  const q = state.query.toLowerCase();
  return state.stories.filter(
    (story) =>
      story.title.toLowerCase().includes(q) ||
      story.by.toLowerCase().includes(q)
  );
}

function updateListView() {
  const filtered = getFilteredStories();
  storyList.innerHTML = renderStories(filtered);

  if (state.query && !filtered.length) {
    storyList.innerHTML = '<p class="empty-state">No stories match your search.</p>';
  }
}

function setActiveTab(type) {
  state.type = type;
  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
}

async function loadStories() {
  showLoading(storyList);
  statusBar.textContent = 'Loading…';

  try {
    const data = await fetchStories(state.type, 30);
    state.stories = data.stories;
    updateListView();
    statusBar.textContent = `${data.count} stories · ${data.source === 'cache' ? 'cached' : 'live'}`;
  } catch (error) {
    showError(storyList, error.message);
    statusBar.textContent = 'Could not load stories';
  }
}

async function handleStoryDetails(id) {
  try {
    statusBar.textContent = 'Opening…';
    const data = await fetchStory(id);
    openModal(data.story, data.source);
    statusBar.textContent = `${state.stories.length || 30} stories · ${data.source === 'cache' ? 'cached' : 'live'}`;
  } catch (error) {
    statusBar.textContent = error.message;
  }
}

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    if (type === state.type) return;
    setActiveTab(type);
    loadStories();
  });
});

searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  syncSearchClear();
  updateListView();
});

if (searchClear) {
  searchClear.addEventListener('click', clearSearch);
}

storyList.addEventListener('click', (event) => {
  if (event.target.id === 'retry-btn') {
    loadStories();
    return;
  }

  const row = event.target.closest('.story-row');
  if (!row || row.classList.contains('skeleton')) return;

  if (event.target.closest('.story-title a') || event.target.closest('.hn-link')) {
    return;
  }

  // Row click or explicit "View details" opens the modal
  handleStoryDetails(Number(row.dataset.id));
});

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('story-modal').addEventListener('click', (event) => {
  if (event.target.classList.contains('modal-backdrop')) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

setDateline();
setActiveTab('top');
loadStories();
