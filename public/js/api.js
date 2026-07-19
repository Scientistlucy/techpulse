async function fetchStories(type = 'top', limit = 30) {
  const params = new URLSearchParams({ type, limit: String(limit) });
  const response = await fetch(`/api/stories?${params.toString()}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || 'Failed to load stories');
  }

  return response.json();
}

async function fetchStory(id) {
  const response = await fetch(`/api/stories/${id}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || 'Failed to load story');
  }

  return response.json();
}

export { fetchStories, fetchStory };
