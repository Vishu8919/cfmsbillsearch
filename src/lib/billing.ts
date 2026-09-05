// src/lib/billing.ts — talking to the billing backend, and to Razorpay Checkout.

import { API_URL, getToken, ApiError } from './auth';

export type Period = 'monthly' | 'yearly';
export type Tier = 'public' | 'department';
export type VerificationStatus = 'pending' | 'action_required' | 'approved' | 'rejected';

export interface PlanOption {
  key: string;
  tier: Tier;
  period: Period;
  amountPaise: number;
  amountRupees: number;
  label: string;
}

export interface Subscription {
  active: boolean;
  plan: string | null;
  tier: Tier;
  mode: 'one_time' | 'autopay' | 'grandfathered' | null;
  startedAt: string | null;
  expiresAt: string | null;
  autopayStatus: string | null;
  cancelAtPeriodEnd: boolean;
  grandfatheredAt: string | null;
}

export interface Entitlements {
  plan: 'free' | 'pro' | 'preview';
  billsPerDay: number | null;
  savedBatches: number;
  trackedBills: number;
  historyDays: number | null;
  excelExport: boolean;
  ads: boolean;
}

export interface PlansResponse {
  billingEnabled: boolean;
  keyId: string | null;
  tier: Tier;
  plans: PlanOption[];
  entitlements: Entitlements;
  current: Subscription | null;
}

export interface PaymentRow {
  id: string;
  planKey: string;
  tier: Tier;
  period: Period;
  mode: string;
  amountRupees: number;
  status: string;
  method: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  reference: string | null;
  createdAt: string;
}

export interface VerificationState {
  status: VerificationStatus | null;
  cfmsId?: string;
  attempts?: number;
  submittedAt?: string;
  decidedAt?: string | null;
  actionReason?: string | null;
  rejectionReason?: string | null;
  canSubmit: boolean;
  canResubmit?: boolean;
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
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
    /* non-JSON */
  }

  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as T;
}

// ── Razorpay Checkout script ─────────────────────────────────────────────
//
// Loaded on demand, when the user actually clicks Buy -- NOT in _document.tsx.
// With output: 'export' every page is statically generated, so a script tag in
// _document would pull a third-party script into all 17 pages, including the
// article pages that carry the SEO traffic. Same lazy pattern the PDF export
// already uses for jsPDF.
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let checkoutPromise: Promise<void> | null = null;

export function loadCheckout(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in a browser.'));
  if ((window as unknown as { Razorpay?: unknown }).Razorpay) return Promise.resolve();
  if (checkoutPromise) return checkoutPromise;

  checkoutPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Could not load the payment window.')));
      return;
    }
    const el = document.createElement('script');
    el.src = CHECKOUT_SRC;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever --
      // this is usually a flaky connection, not a permanent problem.
      checkoutPromise = null;
      reject(new Error('Could not load the payment window. Please check your connection.'));
    };
    document.body.appendChild(el);
  });

  return checkoutPromise;
}

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

type RazorpayCtor = new (options: Record<string, unknown>) => { open: () => void };

// ── API calls ────────────────────────────────────────────────────────────

export function fetchPlans(): Promise<PlansResponse> {
  return api<PlansResponse>('/api/billing/plans');
}

export function fetchPayments(): Promise<{ payments: PaymentRow[] }> {
  return api<{ payments: PaymentRow[] }>('/api/billing/payments');
}

export function fetchVerification(): Promise<VerificationState> {
  return api<VerificationState>('/api/verification');
}

export function cancelAutopay(): Promise<{ ok: boolean; message: string; expiresAt: string | null }> {
  return api('/api/billing/subscription/cancel', { method: 'POST' });
}

// ── One-time payment ─────────────────────────────────────────────────────
//
// The browser callback to /verify exists for LATENCY, so Pro appears
// immediately. The webhook is the authority: if the user closes the tab
// between paying and the callback, access is still granted server-side. Both
// paths call the same idempotent grant, so a double-grant is impossible.
export async function payOnce(
  period: Period,
  user: { name?: string; email?: string } = {}
): Promise<{ ok: boolean; alreadyProcessed?: boolean }> {
  const order = await api<{
    orderId: string;
    amountPaise: number;
    keyId: string;
    label: string;
  }>('/api/billing/order', {
    method: 'POST',
    body: JSON.stringify({ period }),
  });

  await loadCheckout();
  const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;

  return new Promise((resolve, reject) => {
    const rz = new Razorpay({
      key: order.keyId,
      amount: order.amountPaise,
      currency: 'INR',
      name: 'CFMS Bills Status',
      description: order.label,
      order_id: order.orderId,
      prefill: { name: user.name || '', email: user.email || '' },
      theme: { color: '#6366f1' },
      handler: async (resp: RazorpayHandlerResponse) => {
        try {
          const out = await api<{ ok: boolean; alreadyProcessed: boolean }>('/api/billing/verify', {
            method: 'POST',
            body: JSON.stringify(resp),
          });
          resolve(out);
        } catch (err) {
          // The payment itself succeeded -- only our confirmation failed. Say
          // so precisely, because "payment failed" here would be false and
          // would send the user to pay a second time.
          reject(
            new Error(
              'Your payment went through, but we could not confirm it immediately. ' +
              'It will be applied within a few minutes. Please refresh before paying again.'
            )
          );
          console.error('verify failed after successful payment:', err);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled.')),
      },
    });
    rz.open();
  });
}

// ── Autopay ──────────────────────────────────────────────────────────────
export async function startAutopay(
  period: Period,
  user: { name?: string; email?: string } = {}
): Promise<{ ok: boolean }> {
  const sub = await api<{ subscriptionId: string; keyId: string; period: Period }>(
    '/api/billing/subscription',
    { method: 'POST', body: JSON.stringify({ period }) }
  );

  await loadCheckout();
  const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay;

  return new Promise((resolve, reject) => {
    const rz = new Razorpay({
      key: sub.keyId,
      subscription_id: sub.subscriptionId,
      name: 'CFMS Bills Status',
      description: sub.period === 'yearly' ? 'Pro — yearly, auto-renewing' : 'Pro — monthly, auto-renewing',
      prefill: { name: user.name || '', email: user.email || '' },
      theme: { color: '#6366f1' },
      handler: async (resp: RazorpaySubscriptionResponse) => {
        try {
          await api('/api/billing/subscription/verify', {
            method: 'POST',
            body: JSON.stringify(resp),
          });
          resolve({ ok: true });
        } catch (err) {
          reject(new Error('Your mandate was authorised but we could not confirm it. Please refresh.'));
          console.error('subscription verify failed:', err);
        }
      },
      modal: { ondismiss: () => reject(new Error('Setup cancelled.')) },
    });
    rz.open();
  });
}

// ── Department verification ──────────────────────────────────────────────
//
// Multipart, so this bypasses api() entirely: setting Content-Type by hand
// would omit the multipart boundary and the server would parse nothing. The
// browser must set that header itself.
export async function submitVerification(input: {
  cfmsId: string;
  files: File[];
}): Promise<{ ok: boolean; status: string; attempts: number }> {
  const form = new FormData();
  form.append('cfmsId', input.cfmsId);
  form.append('consent', 'true');
  input.files.forEach((f) => form.append('documents', f));

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/verification`, { method: 'POST', headers, body: form });
  } catch {
    throw new Error('Could not reach the server. Please check your connection.');
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Upload failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data as { ok: boolean; status: string; attempts: number };
}

// ── Admin ────────────────────────────────────────────────────────────────

export interface AdminVerificationRow {
  id: string;
  user: { id: string; email: string; name?: string } | null;
  cfmsId: string;
  status: VerificationStatus;
  attempts: number;
  submittedAt: string;
  documentCount?: number;
}

export function adminFetchVerifications(
  status: VerificationStatus = 'pending'
): Promise<{ verifications: AdminVerificationRow[] }> {
  return api(`/api/verification/admin/queue?status=${encodeURIComponent(status)}`);
}

export function adminDecideVerification(
  id: string,
  decision: 'approve' | 'reject' | 'request_changes' | 'reopen',
  reason?: string
): Promise<{ ok: boolean; status: VerificationStatus }> {
  return api(`/api/verification/admin/${id}/decide`, {
    method: 'POST',
    body: JSON.stringify({ decision, reason: reason || '' }),
  });
}

// Documents are behind an authenticated admin route, so they cannot be used as
// a plain <img src>. Fetch as a blob and hand back an object URL — and the
// caller must revokeObjectURL when done, or the bytes stay in memory.
export async function adminFetchDocument(id: string, index: number): Promise<string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/verification/admin/${id}/document/${index}`, { headers });
  if (!res.ok) {
    throw new ApiError(
      res.status === 404
        ? 'No document — it was deleted when the decision was recorded.'
        : 'Could not load the document.',
      res.status
    );
  }
  return URL.createObjectURL(await res.blob());
}

export function formatINR(rupees: number): string {
  return `\u20B9${rupees.toLocaleString('en-IN')}`;
}
