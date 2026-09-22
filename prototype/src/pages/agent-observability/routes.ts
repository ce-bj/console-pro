export interface TraceRouteParams {
  tenantId: string;
  agentId: string;
  sessionId: string;
  traceId: string;
}

export interface TraceReturnContext {
  returnTo?: string;
  returnLabel?: string;
}

const OBSERVABILITY_PREFIX = '/platform/agent-observability';

export function tracePath({ tenantId, agentId, sessionId, traceId }: TraceRouteParams) {
  return `${OBSERVABILITY_PREFIX}/tenants/${tenantId}/agents/${agentId}/sessions/${sessionId}/traces/${traceId}`;
}

export function tracePathWithReturn(params: TraceRouteParams, context: Required<TraceReturnContext>) {
  const query = new URLSearchParams({ returnTo: context.returnTo, returnLabel: context.returnLabel });
  return `${tracePath(params)}?${query.toString()}`;
}

export function resolveTraceReturn(search: string, fallback: string): Required<TraceReturnContext> {
  const query = new URLSearchParams(search);
  const returnTo = query.get('returnTo');
  const returnLabel = query.get('returnLabel') ?? new URLSearchParams(returnTo?.split('?')[1] ?? '').get('returnLabel');
  if (returnTo?.startsWith(OBSERVABILITY_PREFIX)) return { returnTo, returnLabel: returnLabel || '返回上一页' };
  return { returnTo: fallback, returnLabel: '返回 Session' };
}
