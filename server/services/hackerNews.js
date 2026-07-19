const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

const STORY_TYPES = {
  top: 'topstories',
  new: 'newstories',
  best: 'beststories',
};

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Hacker News API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function normalizeStory(item) {
  if (!item || item.type !== 'story') {
    return null;
  }

  return {
    id: item.id,
    title: item.title || 'Untitled',
    url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
    score: item.score || 0,
    by: item.by || 'unknown',
    time: item.time || 0,
    descendants: item.descendants || 0,
    type: item.type,
  };
}

async function fetchStoryIds(type) {
  const endpoint = STORY_TYPES[type];
  if (!endpoint) {
    throw new Error(`Invalid story type: ${type}`);
  }
  return fetchJson(`${HN_BASE}/${endpoint}.json`);
}

async function fetchItem(id) {
  const item = await fetchJson(`${HN_BASE}/item/${id}.json`);
  return normalizeStory(item);
}

async function fetchItems(ids, limit = 30, concurrency = 10) {
  const selected = ids.slice(0, limit);
  const stories = [];

  for (let i = 0; i < selected.length; i += concurrency) {
    const batch = selected.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((id) => fetchItem(id)));
    stories.push(...results.filter(Boolean));
  }

  return stories;
}

async function fetchStories(type, limit = 30) {
  const ids = await fetchStoryIds(type);
  return fetchItems(ids, limit);
}

async function fetchStoryById(id) {
  const item = await fetchJson(`${HN_BASE}/item/${id}.json`);
  if (!item) {
    return null;
  }

  if (item.type === 'story') {
    return normalizeStory(item);
  }

  return {
    id: item.id,
    title: item.title || `Item #${item.id}`,
    url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
    score: item.score || 0,
    by: item.by || 'unknown',
    time: item.time || 0,
    descendants: item.descendants || 0,
    type: item.type,
    text: item.text || null,
  };
}

module.exports = {
  fetchStories,
  fetchStoryById,
};
