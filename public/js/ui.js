function formatTime(unixSeconds) {
  const date = new Date(unixSeconds * 1000);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatRelative(unixSeconds) {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderSkeletons(count = 8) {
  return Array.from({ length: count })
    .map(
      () => `
        <article class="story-row skeleton">
          <div class="story-rank">·</div>
          <div>
            <div class="skeleton-line title"></div>
            <div class="skeleton-line meta"></div>
          </div>
          <div class="skeleton-line details-skel"></div>
        </article>
      `
    )
    .join('');
}

function renderStoryRow(story, index) {
  const hnUrl = `https://news.ycombinator.com/item?id=${story.id}`;
  return `
    <article class="story-row" data-id="${story.id}">
      <div class="story-rank">${index + 1}</div>
      <div class="story-content">
        <h2 class="story-title">
          <a href="${escapeHtml(story.url)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(story.title)}
          </a>
        </h2>
        <div class="story-meta">
          <span class="score">${story.score} pts</span>
          <span>by ${escapeHtml(story.by)}</span>
          <span>${formatRelative(story.time)}</span>
          <span>${story.descendants} comments</span>
          <a class="hn-link" href="${hnUrl}" target="_blank" rel="noopener noreferrer">discuss</a>
        </div>
      </div>
      <button class="details-btn" type="button">View details</button>
    </article>
  `;
}

function renderStories(stories) {
  if (!stories.length) {
    return '<p class="empty-state">No stories found.</p>';
  }

  return stories.map((story, index) => renderStoryRow(story, index)).join('');
}

function showLoading(container) {
  container.innerHTML = renderSkeletons();
}

function showError(container, message) {
  container.innerHTML = `<div class="error-state"><p>${escapeHtml(message)}</p><button type="button" id="retry-btn">Try again</button></div>`;
}

function openModal(story, source) {
  const modal = document.getElementById('story-modal');
  const body = document.getElementById('modal-body');
  const sourceNote = document.getElementById('modal-source');

  sourceNote.textContent = source === 'cache' ? 'Loaded from saved data' : 'Fetched just now';

  body.innerHTML = `
    <h2 id="modal-title">${escapeHtml(story.title)}</h2>
    <dl class="detail-list">
      <dt>Score</dt><dd>${story.score}</dd>
      <dt>Author</dt><dd>${escapeHtml(story.by)}</dd>
      <dt>Posted</dt><dd>${formatTime(story.time)}</dd>
      <dt>Comments</dt><dd>${story.descendants}</dd>
    </dl>
    <div class="modal-actions">
      <a class="btn primary" href="${escapeHtml(story.url)}" target="_blank" rel="noopener noreferrer">Open article</a>
      <a class="btn secondary" href="https://news.ycombinator.com/item?id=${story.id}" target="_blank" rel="noopener noreferrer">HN thread</a>
    </div>
  `;

  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeModal() {
  const modal = document.getElementById('story-modal');
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

export {
  renderStories,
  showLoading,
  showError,
  openModal,
  closeModal,
  formatTime,
};
