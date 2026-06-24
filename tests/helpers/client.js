// Minimal HTTP client with a cookie jar, run against a live gateway. Zero deps (Node fetch).
const BASE_URL = (process.env.GATEWAY_URL || "http://localhost:8080").replace(/\/$/, "");

// Strip attributes; keep name=value so the jar can echo it back on the next request.
function parseSetCookies(headerList, jar) {
  for (const raw of headerList) {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

export function createClient() {
  const jar = new Map();

  async function request(method, path, body) {
    const headers = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (jar.size > 0) {
      headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    parseSetCookies(res.headers.getSetCookie?.() ?? [], jar);

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }

  return {
    baseUrl: BASE_URL,
    hasCookie: (name) => jar.has(name),
    clearCookies: () => jar.clear(),
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    put: (path, body) => request("PUT", path, body),
    del: (path) => request("DELETE", path)
  };
}

// Login helpers read seeded credentials from env so no secrets live in the repo.
export function adminCredentials() {
  return { email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD };
}

export function teacherCredentials() {
  return { email: process.env.TEST_TEACHER_EMAIL, password: process.env.TEST_TEACHER_PASSWORD };
}

export function requireEnv(...names) {
  const missing = names.filter((name) => !process.env[name]);
  return missing.length === 0 ? null : `missing env: ${missing.join(", ")}`;
}
