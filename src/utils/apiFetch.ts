/**
 * apiFetch — a thin wrapper around fetch that:
 *  1. Attaches the stored JWT as an Authorization header on every request.
 *  2. Sets JSON content-type for requests with a body (unless it's FormData).
 *  3. On 401/403, clears the session and bounces to /login.
 *
 * Usage (drop-in replacement for fetch):
 *   const res = await apiFetch('/api/agents');
 *   const res = await apiFetch('/api/agents', { method: 'POST', body: JSON.stringify(data) });
 *
 * For file uploads, pass a FormData body and DO NOT set Content-Type yourself:
 *   const res = await apiFetch('/api/upload', { method: 'POST', body: formData });
 */

const TOKEN_KEY = "proppost_token";
const USER_KEY = "proppost_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function clearSessionAndRedirect() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Only set JSON content-type when sending a non-FormData body.
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 || res.status === 403) {
    clearSessionAndRedirect();
  }

  return res;
}

export default apiFetch;
