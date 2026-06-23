import pool from "../config/db.js";
import * as authRepo from "../repositories/auth.repository.js";
import { readPositiveIntegerEnv } from "../utils/env.js";
import { getCachedJson, invalidateCache } from "./cache.service.js";

// The revoked-token lookup runs on every authenticated request, so cache the result for
// a short TTL: active sessions stay off the DB, and logout invalidates the entry so a
// revocation is seen immediately when the cache layer is reachable.
const TTL_MS = readPositiveIntegerEnv("REVOKED_TOKEN_CACHE_TTL_MS", 60000);

function cacheKey(tokenHash) {
  return `revoked:${tokenHash}`;
}

export async function isTokenRevoked(tokenHash) {
  return getCachedJson(cacheKey(tokenHash), TTL_MS, () =>
    authRepo.existsRevokedToken(pool, tokenHash),
  );
}

export async function invalidateRevokedToken(tokenHash) {
  await invalidateCache(cacheKey(tokenHash));
}
