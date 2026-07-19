const express = require('express');
const firestore = require('../services/firestore');

const router = express.Router();

function listCacheKey(type, limit) {
  return `list_${type}_${limit}`;
}

function itemCacheKey(id) {
  return `story_${id}`;
}

router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type || 'top';
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 50);
    const cacheKey = listCacheKey(type, limit);

    const cached = await firestore.getCached(cacheKey);
    if (cached) {
      return res.json({
        source: 'cache',
        type,
        count: cached.length,
        stories: cached,
      });
    }

    const hackerNews = require('../services/hackerNews');
    const stories = await hackerNews.fetchStories(type, limit);
    const { expiresAtFor } = require('../utils/cache');
    await firestore.setCached(cacheKey, stories, expiresAtFor('list'));

    res.json({
      source: 'api',
      type,
      count: stories.length,
      stories,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid story id' });
    }

    const cacheKey = itemCacheKey(id);
    const cached = await firestore.getCached(cacheKey);
    if (cached) {
      return res.json({
        source: 'cache',
        story: cached,
      });
    }

    const hackerNews = require('../services/hackerNews');
    const story = await hackerNews.fetchStoryById(id);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const { expiresAtFor } = require('../utils/cache');
    await firestore.setCached(cacheKey, story, expiresAtFor('item'));

    res.json({
      source: 'api',
      story,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
