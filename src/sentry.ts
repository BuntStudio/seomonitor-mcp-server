import * as Sentry from '@sentry/node';
import crypto from 'crypto';

// Error tracking is opt-in via SENTRY_DSN so local/stdio runs stay silent.
const dsn = process.env.SENTRY_DSN;

export const sentryEnabled = !!dsn;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    // Performance: every tool call becomes a transaction (see traceToolCall).
    // Full sampling is fine at beta volume; dial down via env when usage grows.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '1'),
  });
}

export interface SentryUserRef { id: string }

// Identify the tenant without exposing the credential: the apigw JWT's kid
// equals users.tyk_api_key in the admin DB (map back with
// SELECT id, email FROM users WHERE tyk_api_key = '<id>'). Non-JWT keys fall
// back to a truncated hash so distinct keys are still distinguishable.
export function deriveUserFromApiKey(apiKey: string | undefined): SentryUserRef | undefined {
  if (!apiKey) return undefined;
  try {
    const header = JSON.parse(Buffer.from(apiKey.split('.')[0], 'base64url').toString('utf8'));
    if (header?.kid) return { id: String(header.kid) };
  } catch {
    // not a JWT — fall through to the hash
  }
  return { id: `sha256:${crypto.createHash('sha256').update(apiKey).digest('hex').slice(0, 16)}` };
}

// Wraps a tool execution in its own transaction so the Performance view
// shows per-tool timing (p95 by tool name) instead of a generic POST /mcp.
// The isolation scope keeps the user from bleeding across concurrent calls.
export async function traceToolCall<T>(toolName: string, user: SentryUserRef | undefined, fn: () => Promise<T>): Promise<T> {
  if (!sentryEnabled) return fn();
  return Sentry.withIsolationScope((scope) => {
    if (user) scope.setUser(user);
    return Sentry.startSpan(
      { name: toolName, op: 'mcp.tool', forceTransaction: true, attributes: { 'mcp.tool': toolName } },
      fn,
    );
  });
}

export function captureToolError(error: unknown, context: { toolName: string; durationMs: number; httpStatus?: number; user?: SentryUserRef }) {
  if (!sentryEnabled) return;
  Sentry.withScope((scope) => {
    if (context.user) scope.setUser(context.user);
    scope.setTag('tool', context.toolName);
    if (context.httpStatus) scope.setTag('upstream_status', String(context.httpStatus));
    scope.setContext('tool_call', {
      tool: context.toolName,
      duration_ms: context.durationMs,
      upstream_status: context.httpStatus,
    });
    Sentry.captureException(error);
  });
}

export function captureFatal(error: unknown, origin: string) {
  if (!sentryEnabled) return;
  Sentry.withScope((scope) => {
    scope.setTag('origin', origin);
    scope.setLevel('fatal');
    Sentry.captureException(error);
  });
}

export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!sentryEnabled) return;
  try {
    await Sentry.flush(timeoutMs);
  } catch {
    // flushing is best-effort during shutdown
  }
}
