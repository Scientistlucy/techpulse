const { GoogleAuth } = require('google-auth-library');
const { isFresh } = require('../utils/cache');

const COLLECTION = 'hn_cache';
let authClient = null;
let projectId = null;
let cacheEnabled = true;

function getProjectId() {
  if (!projectId) {
    projectId = process.env.FIREBASE_PROJECT_ID;
  }
  return projectId;
}

function normalizeServiceAccountRaw(raw) {
  let value = String(raw).trim();

  // Remove BOM / wrapping quotes sometimes added by dashboards
  if (value.charCodeAt(0) === 0xfeff) {
    value = value.slice(1);
  }
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"') && !value.startsWith('{'))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value;
}

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(normalizeServiceAccountRaw(raw));
  } catch (error) {
    console.warn(
      'Firestore cache disabled: FIREBASE_SERVICE_ACCOUNT is not valid JSON.',
      error.message
    );
    return null;
  }
}

function isConfigured() {
  return Boolean(getProjectId() && getServiceAccount());
}

async function getAuthClient() {
  if (!isConfigured()) {
    cacheEnabled = false;
    return null;
  }

  if (!authClient) {
    const credentials = getServiceAccount();
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/datastore'],
    });
    authClient = await auth.getClient();
  }

  return authClient;
}

async function getAccessToken() {
  const client = await getAuthClient();
  if (!client) {
    return null;
  }

  const tokenResponse = await client.getAccessToken();
  return tokenResponse.token;
}

function baseUrl() {
  return `https://firestore.googleapis.com/v1/projects/${getProjectId()}/databases/(default)/documents`;
}

function encodeDocId(docId) {
  return encodeURIComponent(docId);
}

function fromFirestoreValue(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;

  if ('mapValue' in value) {
    const fields = value.mapValue.fields || {};
    const result = {};
    for (const [key, nested] of Object.entries(fields)) {
      result[key] = fromFirestoreValue(nested);
    }
    return result;
  }

  if ('arrayValue' in value) {
    const values = value.arrayValue.values || [];
    return values.map(fromFirestoreValue);
  }

  return null;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }
    return { doubleValue: value };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    };
  }

  if (typeof value === 'object') {
    const fields = {};
    for (const [key, nested] of Object.entries(value)) {
      fields[key] = toFirestoreValue(nested);
    }
    return { mapValue: { fields } };
  }

  return { stringValue: String(value) };
}

function parseDocument(doc) {
  if (!doc || !doc.fields) {
    return null;
  }

  const parsed = {};
  for (const [key, value] of Object.entries(doc.fields)) {
    parsed[key] = fromFirestoreValue(value);
  }

  if (parsed.payload && typeof parsed.payload === 'string') {
    try {
      parsed.payload = JSON.parse(parsed.payload);
    } catch {
      // keep raw string
    }
  }

  return parsed;
}

async function getDocument(docId) {
  if (!cacheEnabled || !isConfigured()) {
    return null;
  }

  const token = await getAccessToken();
  if (!token) {
    return null;
  }

  const url = `${baseUrl()}/${COLLECTION}/${encodeDocId(docId)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    console.warn(`Firestore read failed (${response.status}): ${body}`);
    return null;
  }

  return parseDocument(await response.json());
}

async function setDocument(docId, data) {
  if (!cacheEnabled || !isConfigured()) {
    return false;
  }

  const token = await getAccessToken();
  if (!token) {
    return false;
  }

  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'payload') {
      fields[key] = toFirestoreValue(JSON.stringify(value));
    } else {
      fields[key] = toFirestoreValue(value);
    }
  }

  const fieldPaths = Object.keys(fields)
    .map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`)
    .join('&');

  const url = `${baseUrl()}/${COLLECTION}/${encodeDocId(docId)}?${fieldPaths}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.warn(`Firestore write failed (${response.status}): ${body}`);
    return false;
  }

  return true;
}

async function getCached(docId) {
  const doc = await getDocument(docId);
  if (!doc) {
    return null;
  }

  if (!isFresh(doc.expiresAt)) {
    return null;
  }

  return doc.payload ?? null;
}

async function setCached(docId, payload, expiresAt) {
  return setDocument(docId, {
    payload,
    cachedAt: Date.now(),
    expiresAt,
  });
}

module.exports = {
  isConfigured,
  getCached,
  setCached,
};
