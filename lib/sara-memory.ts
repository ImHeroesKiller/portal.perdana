/**
 * Sara chat session memory — Firestore (server-only).
 * In-process cache + local Map fallback when Firebase Admin is not configured.
 */

import { randomUUID } from 'crypto';
import type { CandidatePayload } from './candidate-payload';
import {
  extractFieldsFromChat,
  formatKnownFieldsContext,
  formatLastTurnValidationHint,
  getNextMissingField,
  parseSixteenDigitId,
} from './sara-chat-extract';
import { getAdminDb, isAdminConfigured } from './firebase-admin';

export const SARA_SESSIONS_COLLECTION = 'sara_sessions';

export interface SaraMemoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SaraSession {
  sessionId: string;
  userId?: string;
  createdAt: string;
  lastUpdated: string;
  messages: SaraMemoryMessage[];
  candidateData: Partial<CandidatePayload>;
  currentStep: string;
}

const localStore = new Map<string, SaraSession>();

export type SessionIdSkipFlags = {
  alreadyHasNik: boolean;
  alreadyHasKk: boolean;
  alreadyHasNpwp: boolean;
};

/** True when value is exactly 16 numeric digits (NIK/KK/NPWP). */
export function isValidSixteenDigitField(value: unknown): boolean {
  if (value == null) return false;
  return parseSixteenDigitId(String(value)) !== null;
}

/** Skip flags from persisted candidateData — used before sending prompt to model. */
export function getSessionIdSkipFlags(
  candidate: Partial<CandidatePayload>
): SessionIdSkipFlags {
  return {
    alreadyHasNik: isValidSixteenDigitField(candidate.nik),
    alreadyHasKk: isValidSixteenDigitField(candidate.kkNumber),
    alreadyHasNpwp: isValidSixteenDigitField(candidate.npwp),
  };
}

/**
 * Build prompt context from session memory (candidateData + chat).
 * Prioritises candidateData; marks valid 16-digit IDs as do-not-ask.
 */
export function buildSaraSessionContext(session: SaraSession): string {
  const candidate = session.candidateData || {};
  const turns = session.messages.map((m) => ({ role: m.role, content: m.content }));
  const fromChat = extractFieldsFromChat(turns);
  const merged: Partial<CandidatePayload> = { ...fromChat, ...candidate };

  const { alreadyHasNik, alreadyHasKk, alreadyHasNpwp } = getSessionIdSkipFlags(candidate);

  let context = formatKnownFieldsContext(merged);

  const idLines: string[] = [];
  if (alreadyHasNik) {
    idLines.push(`✓ NIK: ${parseSixteenDigitId(String(candidate.nik))}`);
  }
  if (alreadyHasKk) {
    idLines.push(`✓ Nomor KK: ${parseSixteenDigitId(String(candidate.kkNumber))}`);
  }
  if (alreadyHasNpwp) {
    idLines.push(`✓ NPWP: ${parseSixteenDigitId(String(candidate.npwp))}`);
  }

  if (idLines.length > 0) {
    context += '\n\nIDENTITAS SUDAH VALID (jangan tanya & jangan validasi ulang):';
    context += `\n${idLines.join('\n')}`;
  }

  const skipLabels: string[] = [];
  if (alreadyHasNik) skipLabels.push('NIK');
  if (alreadyHasKk) skipLabels.push('Nomor KK');
  if (alreadyHasNpwp) skipLabels.push('NPWP');
  if (skipLabels.length > 0) {
    context += `\nSKIP (sudah terisi valid): ${skipLabels.join(', ')}`;
  }

  const validation = formatLastTurnValidationHint(turns);
  if (validation) {
    const skipNikHint = alreadyHasNik && /NIK/i.test(validation);
    const skipKkHint = alreadyHasKk && /\bKK\b/i.test(validation);
    if (!skipNikHint && !skipKkHint) {
      context += `\n\n${validation}`;
    }
  }

  if (session.currentStep && session.currentStep !== 'complete') {
    context += `\n\nLANJUTKAN DARI MEMORY: "${session.currentStep}"`;
  }

  return context;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeRole(role: string): 'user' | 'assistant' {
  return role === 'assistant' ? 'assistant' : 'user';
}

function resolveCurrentStep(
  messages: SaraMemoryMessage[],
  candidateData: Partial<CandidatePayload>
): string {
  const turns = messages.map((m) => ({ role: m.role, content: m.content }));
  const data =
    Object.keys(candidateData).length > 0 ? candidateData : extractFieldsFromChat(turns);
  const next = getNextMissingField(data);
  return next?.label ?? 'complete';
}

function recomputeSession(session: SaraSession): SaraSession {
  const turns = session.messages.map((m) => ({ role: m.role, content: m.content }));
  session.candidateData = extractFieldsFromChat(turns);
  session.currentStep = resolveCurrentStep(session.messages, session.candidateData);
  session.lastUpdated = nowIso();
  return session;
}

function cloneSession(session: SaraSession): SaraSession {
  return {
    ...session,
    messages: session.messages.map((m) => ({ ...m })),
    candidateData: { ...session.candidateData },
  };
}

/** Firestore rejects undefined field values — strip before write. */
function stripUndefined<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) out[key] = stripUndefined(val);
  }
  return out as T;
}

async function persistSession(session: SaraSession): Promise<void> {
  localStore.set(session.sessionId, cloneSession(session));

  if (!isAdminConfigured()) return;

  try {
    const db = await getAdminDb();
    const { sessionId, ...data } = session;
    await db
      .collection(SARA_SESSIONS_COLLECTION)
      .doc(sessionId)
      .set(stripUndefined(data), { merge: true });
  } catch (error) {
    console.warn('Sara session Firestore persist failed (using in-memory cache):', error);
  }
}

function docToSession(sessionId: string, data: Record<string, unknown>): SaraSession {
  const messages = Array.isArray(data.messages)
    ? (data.messages as SaraMemoryMessage[]).map((m) => ({
        role: normalizeRole(String(m.role)),
        content: String(m.content ?? ''),
        timestamp: String(m.timestamp ?? nowIso()),
      }))
    : [];

  return {
    sessionId,
    userId: typeof data.userId === 'string' ? data.userId : undefined,
    createdAt: String(data.createdAt ?? nowIso()),
    lastUpdated: String(data.lastUpdated ?? nowIso()),
    messages,
    candidateData: (data.candidateData as Partial<CandidatePayload>) ?? {},
    currentStep: String(data.currentStep ?? 'start'),
  };
}

export function isSaraMemoryEnabled(): boolean {
  return isAdminConfigured() || localStore.size > 0;
}

/** Create a new chat session with optional seed messages. */
export async function createSession(
  userId?: string,
  initialMessages: SaraMemoryMessage[] = []
): Promise<SaraSession> {
  const sessionId = randomUUID();
  const now = nowIso();

  const session: SaraSession = {
    sessionId,
    userId: userId?.trim() || undefined,
    createdAt: now,
    lastUpdated: now,
    messages: initialMessages.map((m) => ({
      role: normalizeRole(m.role),
      content: String(m.content),
      timestamp: m.timestamp || now,
    })),
    candidateData: {},
    currentStep: 'start',
  };

  recomputeSession(session);
  await persistSession(session);
  return cloneSession(session);
}

/** Load session by ID (Firestore → local cache). */
export async function getSession(sessionId: string): Promise<SaraSession | null> {
  const cached = localStore.get(sessionId);
  if (cached) return cloneSession(cached);

  if (!isAdminConfigured()) return null;

  const db = await getAdminDb();
  const snap = await db.collection(SARA_SESSIONS_COLLECTION).doc(sessionId).get();
  if (!snap.exists) return null;

  const session = docToSession(sessionId, snap.data() as Record<string, unknown>);
  localStore.set(sessionId, cloneSession(session));
  return cloneSession(session);
}

/** Patch session fields and recompute derived state. */
export async function updateSession(
  sessionId: string,
  patch: Partial<Pick<SaraSession, 'userId' | 'candidateData' | 'currentStep' | 'messages'>>
): Promise<SaraSession> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Sara session not found: ${sessionId}`);
  }

  if (patch.userId !== undefined) session.userId = patch.userId || undefined;
  if (patch.candidateData !== undefined) session.candidateData = { ...patch.candidateData };
  if (patch.currentStep !== undefined) session.currentStep = patch.currentStep;
  if (patch.messages !== undefined) {
    session.messages = patch.messages.map((m) => ({
      role: normalizeRole(m.role),
      content: String(m.content),
      timestamp: m.timestamp || nowIso(),
    }));
  }

  recomputeSession(session);
  await persistSession(session);
  return cloneSession(session);
}

/** Append a message and refresh candidateData + currentStep. */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<SaraSession> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Sara session not found: ${sessionId}`);
  }

  session.messages.push({
    role,
    content: String(content),
    timestamp: nowIso(),
  });

  recomputeSession(session);
  await persistSession(session);
  return cloneSession(session);
}

/** Return extracted candidate data for a session. */
export async function getCandidateData(
  sessionId: string
): Promise<Partial<CandidatePayload> | null> {
  const session = await getSession(sessionId);
  return session?.candidateData ?? null;
}

/** Sync client message history when client is ahead of stored session. */
export async function syncSessionMessages(
  sessionId: string,
  clientMessages: { role: string; content: string }[]
): Promise<SaraSession> {
  const session = await getSession(sessionId);
  if (!session) {
    throw new Error(`Sara session not found: ${sessionId}`);
  }

  const normalized: SaraMemoryMessage[] = clientMessages.map((m) => ({
    role: normalizeRole(m.role),
    content: String(m.content ?? ''),
    timestamp: nowIso(),
  }));

  if (normalized.length >= session.messages.length) {
    session.messages = normalized;
    recomputeSession(session);
    await persistSession(session);
  }

  return cloneSession(session);
}

function toMemoryMessages(
  messages: { role: string; content: string }[]
): SaraMemoryMessage[] {
  const now = nowIso();
  return messages.map((m) => ({
    role: normalizeRole(m.role),
    content: String(m.content ?? ''),
    timestamp: now,
  }));
}

/**
 * Bootstrap or resume a session for the recruitment-chat API.
 * Returns session + messages ready for Sara model call.
 */
export async function prepareSaraSessionForTurn(options: {
  sessionId?: string;
  userId?: string;
  messages?: { role: string; content: string }[];
  message?: string;
}): Promise<SaraSession> {
  const { sessionId, userId, messages, message } = options;

  if (sessionId) {
    let session = await getSession(sessionId);

    if (!session) {
      const fresh = await createSession(userId, messages ? toMemoryMessages(messages) : []);
      if (message?.trim()) {
        return addMessage(fresh.sessionId, 'user', message.trim());
      }
      return fresh;
    }

    if (message?.trim()) {
      return addMessage(session.sessionId, 'user', message.trim());
    }

    if (messages?.length) {
      return syncSessionMessages(sessionId, messages);
    }

    return session;
  }

  if (messages?.length) {
    return createSession(userId, toMemoryMessages(messages));
  }

  if (message?.trim()) {
    const session = await createSession(userId);
    return addMessage(session.sessionId, 'user', message.trim());
  }

  return createSession(userId);
}