import { InputJsonValue } from '@prisma/client/runtime/library';

/**
 * Convert Record<string, unknown> to Prisma-compatible JSON format
 */
export function toJsonValue(value: Record<string, unknown> | undefined): InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as InputJsonValue;
}

/**
 * Convert any value to Prisma-compatible JSON format
 */
export function toJson(value: unknown): InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value)) as InputJsonValue;
}

