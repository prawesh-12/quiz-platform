import pool from "../config/db.js";
import * as authRepo from "../repositories/auth.repository.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import { getCachedJson, invalidateCache } from "./cache.service.js";

// The revoked-token lookup runs on every authenticated request, so cache the result.
// Revocation is monotonic, so a "revoked" result is safe to cache for the full TTL; a
// "not revoked" result can flip at the next logout, so cache it only briefly to bound how
// long a just-revoked token can still be served as valid.
const TTL_MS = readPositiveIntegerEnv("REVOKED_TOKEN_CACHE_TTL_MS", 60000);
const NEGATIVE_TTL_MS = readPositiveIntegerEnv("REVOKED_TOKEN_NEGATIVE_TTL_MS", 5000);

// Must not be `revoked:<hash>`: other services treat any key under that prefix as a
// revocation, so caching "not revoked" there logs everyone out for the negative TTL.
function cacheKey(tokenHash) {
  return `revoked_cache:${tokenHash}`;
}

function ttlForResult(isRevoked) {
  return isRevoked ? TTL_MS : NEGATIVE_TTL_MS;
}

export async function isTokenRevoked(tokenHash) {
  return getCachedJson(cacheKey(tokenHash), ttlForResult, () =>
    authRepo.existsRevokedToken(pool, tokenHash),
  );
}

export async function invalidateRevokedToken(tokenHash) {
  await invalidateCache(cacheKey(tokenHash));
}
