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

// ── Service usage (backend v4.0) ──
// Aggregated from the CheckLog collection. Previously the only record of what
// the service did was console.log on Render, lost on every restart.
export interface AdminUsage {
  days: number;
  totals: {
    batches: number;
    bills: number;
    cached: number;
    failures: number;
    erroredBatches: number;
    avgElapsedSeconds: number;
    avgQueueWaitMs: number;
    cacheHitRate: number;
  };
  daily: { date: string; batches: number; bills: number; failures: number }[];
  topUsers: {
    userId: string;
    username: string;
    role: Role | null;
    bills: number;
    batches: number;
  }[];
}

export async function adminFetchUsage(days = 7): Promise<AdminUsage> {
  return request(`/api/admin/usage?days=${days}`, { method: 'GET' });
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

// ── Bill history & timeline (Phase 2) ──
// The stage timeline is reconstructed from stored snapshots of the bill's flow
// table. `slow` marks a stage that ran well past its treasury's median.
export interface TimelineStage {
  designation: string | null;
  activity: string | null;
  action: string | null;
  status: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationDays: number | null;
  inProgress: boolean;
  benchmarkMedianDays?: number | null;
  slow?: boolean;
}

export interface BillTimelineSummary {
  billNumber: string;
  verdict: string;
  treasuryOffice: string | null;
  totalAgeDays: number | null;
  currentStage: string | null;
  currentActivity: string | null;
  daysAtCurrentStage: number | null;
  bottleneckStage: string | null;
  bottleneckDays: number | null;
  stageCount: number;
  changeEvents: number;
}

export interface BillTimelineResponse {
  billNumber: string;
  summary: BillTimelineSummary | null;
  timeline: TimelineStage[];
  message?: string;
}

export async function fetchBillTimeline(billNumber: string): Promise<BillTimelineResponse> {
  return request(`/api/bills/${encodeURIComponent(billNumber)}/timeline`, { method: 'GET' });
}

export interface BillHistoryEvent {
  at: string | null;
  verdict: string;
  pendingAt: string | null;
  changes: string[];
  seenCount: number;
}

export interface BillHistoryResponse {
  billNumber: string;
  history: BillHistoryEvent[];
  firstSeenAt?: string;
  lastSeenAt?: string;
  message?: string;
}

export async function fetchBillHistory(billNumber: string): Promise<BillHistoryResponse> {
  return request(`/api/bills/${encodeURIComponent(billNumber)}/history`, { method: 'GET' });
}

// ── Tracking & credential vault (Phase 3) ──
export interface CredentialStatus {
  hasCredentials: boolean;
  vaultAvailable: boolean;
  consentAt?: string | null;
  consentVersion?: string;
  currentConsentVersion?: string;
  needsReconsent?: boolean;
  lastVerifiedAt?: string | null;
  lastUsedAt?: string | null;
  failCount?: number;
  disabledReason?: string | null;
  healthy?: boolean;
}

export interface TrackChange {
  at: string | null;
  kind: string;            // status | note | finished
  summary: string | null;
  from: string | null;
  to: string | null;
  remark: string | null;
}

export interface TrackedBill {
  id: string;
  billNumber: string;
  label: string | null;
  active: boolean;
  lastVerdict: string | null;
  lastBillStatus: string | null;
  lastPendingAt: string | null;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
  nextCheckAt: string | null;
  unseenCount: number;
  changes: TrackChange[];
  errorCount: number;
  lastError: string | null;
  stoppedReason: string | null;
  createdAt: string | null;
}

export interface TrackingList {
  tracked: TrackedBill[];
  limit: number;
  activeCount: number;
  unseenTotal: number;
  hasCredentials: boolean;
  vaultAvailable: boolean;
  intervalMinutes: number;
  manualCooldownSeconds: number;
}

export async function fetchCredentialStatus(): Promise<CredentialStatus> {
  return request('/api/tracking/credentials', { method: 'GET' });
}

export async function saveCfmsCredentials(payload: {
  username: string;
  password: string;
  consent: true;
  consentVersion: string;
  probeBill?: string;
}): Promise<{ ok: boolean; message: string }> {
  return request('/api/tracking/credentials', { method: 'POST', body: JSON.stringify(payload) });
}

export async function deleteCfmsCredentials(): Promise<{ ok: boolean; message: string }> {
  return request('/api/tracking/credentials', { method: 'DELETE' });
}

export async function fetchTracking(): Promise<TrackingList> {
  return request('/api/tracking', { method: 'GET' });
}

export async function trackBill(billNumber: string, label?: string): Promise<{ ok: boolean; tracked: TrackedBill }> {
  return request('/api/tracking', { method: 'POST', body: JSON.stringify({ billNumber, label }) });
}

export async function refreshTrackedBill(id: string): Promise<{ ok: boolean; changed: boolean; tracked: TrackedBill }> {
  return request(`/api/tracking/${id}/refresh`, { method: 'POST' });
}

export async function markTrackedSeen(id: string): Promise<{ ok: boolean }> {
  return request(`/api/tracking/${id}/seen`, { method: 'POST' });
}

export async function updateTracking(
  id: string,
  patch: { label?: string; active?: boolean }
): Promise<{ ok: boolean; tracked: TrackedBill }> {
  return request(`/api/tracking/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export async function untrackBill(id: string): Promise<{ ok: boolean }> {
  return request(`/api/tracking/${id}`, { method: 'DELETE' });
}

export interface BulkTrackResult {
  ok: boolean;
  added: string[];
  reactivated: string[];
  already: string[];
  skipped: string[];       // hit the per-user cap
  limit: number;
  activeCount: number;
}

export async function trackBillsBulk(
  bills: { billNumber: string; label?: string }[]
): Promise<BulkTrackResult> {
  return request('/api/tracking/bulk', { method: 'POST', body: JSON.stringify({ bills }) });
}

export interface RefreshAllResult {
  ok: boolean;
  refreshed: number;
  changed: number;
  skipped: number;      // still inside the per-bill cooldown
  failed: number;
  total: number;
  cooldown?: boolean;   // every bill was in cooldown
  busy?: boolean;       // server queue filled mid-run; partial result
  cooldownMinutes?: number;
}

export async function refreshAllTracked(): Promise<RefreshAllResult> {
  return request('/api/tracking/refresh-all', { method: 'POST' });
}
