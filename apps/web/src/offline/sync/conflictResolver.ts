export interface ConflictDetails {
  entityId: string;
  serverEntity: Record<string, unknown>;
  clientPayload: Record<string, unknown>;
}

export function detectConflict(errorDetails: unknown): ConflictDetails | null {
  if (!errorDetails || typeof errorDetails !== 'object') return null;
  const details = errorDetails as Record<string, unknown>;
  if (details.entityId && details.serverEntity && details.clientPayload) {
    return details as ConflictDetails;
  }
  return null;
}
