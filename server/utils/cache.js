const LIST_TTL = parseInt(process.env.CACHE_TTL_LIST_MS || '300000', 10);
const ITEM_TTL = parseInt(process.env.CACHE_TTL_ITEM_MS || '900000', 10);

function isFresh(expiresAt) {
  return typeof expiresAt === 'number' && expiresAt > Date.now();
}

function ttlFor(kind) {
  return kind === 'item' ? ITEM_TTL : LIST_TTL;
}

function expiresAtFor(kind) {
  return Date.now() + ttlFor(kind);
}

module.exports = {
  isFresh,
  ttlFor,
  expiresAtFor,
};
