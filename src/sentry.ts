import * as Sentry from '@sentry/node';

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

// Wraps a tool execution in its own transaction so the Performance view
// shows per-tool timing (p95 by tool name) instead of a generic POST /mcp.
export async function traceToolCall<T>(toolName: string, fn: () => Promise<T>): Promise<T> {
  if (!sentryEnabled) return fn();
  return Sentry.startSpan(
    { name: toolName, op: 'mcp.tool', forceTransaction: true, attributes: { 'mcp.tool': toolName } },
    fn,
  );
}

export function captureToolError(error: unknown, context: { toolName: string; durationMs: number; httpStatus?: number }) {
  if (!sentryEnabled) return;
  Sentry.withScope((scope) => {
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
