require('dotenv').config();

const express = require('express');
const path = require('path');
const storiesRouter = require('./routes/stories');
const firestore = require('./services/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    cache: firestore.isConfigured() ? 'firestore' : 'disabled',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/stories', storiesRouter);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`TechPulse running at http://localhost:${PORT}`);
  if (!firestore.isConfigured()) {
    console.warn('Firestore cache disabled: set FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT in .env');
  }
});
