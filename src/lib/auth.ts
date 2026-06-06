// src/lib/auth.ts — auth API client + token storage
//
// Centralises all calls to the backend auth endpoints and the storage of the
// JWT. The token is kept in localStorage so the session survives refreshes.

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

const TOKEN_KEY = 'cfms_token';

export type Role = 'customer' | 'subscriber' | 'admin';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  adsRemoved: boolean;
  subscription?: {
    active: boolean;
    plan: string | null;
    startedAt: string | null;
    expiresAt: string | null;
  };
  mobile?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

// ── Token storage (guarded for SSR / static export) ──
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// ── Low-level request helper ──
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Could not reach the server. Please check your connection.');
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    const errMsg =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(errMsg);
  }
  return data as T;
}

// ── Auth endpoints ──
export async function registerRequest(input: {
  username: string;
  email: string;
  password: string;
  securityQuestions: { questionId: string; answer: string }[];
}): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function loginRequest(input: {
  identifier: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchMe(): Promise<{ user: AuthUser }> {
  return request('/api/auth/me', { method: 'GET' });
}

// ── Security questions & password reset ──
export interface SecurityQuestion {
  id: string;
  label: string;
}

export async function fetchSecurityQuestions(): Promise<{ questions: SecurityQuestion[] }> {
  return request('/api/auth/security-questions', { method: 'GET' });
}

export async function forgotLookup(identifier: string): Promise<{
  username: string;
  questions: { questionId: string; label: string }[];
}> {
  return request('/api/auth/forgot/lookup', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

export async function forgotReset(input: {
  identifier: string;
  answers: { questionId: string; answer: string }[];
  newPassword: string;
}): Promise<{ ok: boolean; message: string }> {
  return request('/api/auth/forgot/reset', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ── Admin endpoints ──
export interface AdminStats {
  total: number;
  customers: number;
  subscribers: number;
  admins: number;
  disabled: number;
}

export interface AdminUsersResponse {
  users: AuthUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function adminFetchStats(): Promise<AdminStats> {
  return request('/api/admin/stats', { method: 'GET' });
}

export async function adminFetchUsers(params: {
  q?: string;
  page?: number;
  limit?: number;
} = {}): Promise<AdminUsersResponse> {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request(`/api/admin/users${suffix}`, { method: 'GET' });
}

export async function adminSetRole(id: string, role: Role): Promise<{ user: AuthUser }> {
  return request(`/api/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function adminSetActive(id: string, isActive: boolean): Promise<{ user: AuthUser }> {
  return request(`/api/admin/users/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function adminDeleteUser(id: string): Promise<{ ok: boolean; deletedId: string }> {
  return request(`/api/admin/users/${id}`, { method: 'DELETE' });
}

// ── Batch (cloud bill history) endpoints ──
// Shape matches the BatchHistoryItem the UI already uses.
export interface CloudBatch {
  id: string;
  name: string;
  bills: string[];
  createdAt: number;
  lastRunAt: number | null;
  lastSummary: Record<string, number> | null;
}

export async function listBatches(): Promise<{ batches: CloudBatch[] }> {
  return request('/api/batches', { method: 'GET' });
}

export async function createBatch(input: {
  name?: string;
  bills: string[];
  lastRunAt?: number | null;
  lastSummary?: Record<string, number> | null;
}): Promise<{ batch: CloudBatch }> {
  return request('/api/batches', { method: 'POST', body: JSON.stringify(input) });
}

export async function updateBatch(
  id: string,
  input: {
    name?: string;
    bills?: string[];
    lastRunAt?: number | null;
    lastSummary?: Record<string, number> | null;
  }
): Promise<{ batch: CloudBatch }> {
  return request(`/api/batches/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function deleteBatch(id: string): Promise<{ ok: boolean; deletedId: string }> {
  return request(`/api/batches/${id}`, { method: 'DELETE' });
}

export async function migrateBatches(
  batches: CloudBatch[]
): Promise<{ migrated: number; batches: CloudBatch[] }> {
  return request('/api/batches/migrate', {
    method: 'POST',
    body: JSON.stringify({ batches }),
  });
}

// ── Saved single-bill history (cloud) ──
export interface CloudSavedBill {
  id: string;
  year: string;
  billNo: string;
  name: string;
  timestamp: number;
}

export async function listSavedBills(): Promise<{ bills: CloudSavedBill[] }> {
  return request('/api/saved-bills', { method: 'GET' });
}

export async function saveSavedBill(input: {
  year: string;
  billNo: string;
  name?: string;
  timestamp?: number;
}): Promise<{ bill: CloudSavedBill }> {
  return request('/api/saved-bills', { method: 'POST', body: JSON.stringify(input) });
}

export async function renameSavedBill(id: string, name: string): Promise<{ bill: CloudSavedBill }> {
  return request(`/api/saved-bills/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
}

export async function deleteSavedBill(id: string): Promise<{ ok: boolean; deletedId: string }> {
  return request(`/api/saved-bills/${id}`, { method: 'DELETE' });
}

export async function migrateSavedBills(
  bills: { year: string; billNo: string; name?: string; timestamp?: number }[]
): Promise<{ migrated: number; bills: CloudSavedBill[] }> {
  return request('/api/saved-bills/migrate', {
    method: 'POST',
    body: JSON.stringify({ bills }),
  });
}
