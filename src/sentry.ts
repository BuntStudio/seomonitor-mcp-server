import * as Sentry from '@sentry/node';

// Error tracking is opt-in via SENTRY_DSN so local/stdio runs stay silent.
const dsn = process.env.SENTRY_DSN;

export const sentryEnabled = !!dsn;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'production',
    tracesSampleRate: 0,
  });
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
