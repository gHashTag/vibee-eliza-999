import type { UUID } from '@elizaos/core';
import type { AgentServer } from '../index';
/**
 * Validates server_id for RLS (Row Level Security) isolation
 *
 * When ENABLE_RLS_ISOLATION is enabled, only allows access to data
 * belonging to the current server instance.
 *
 * When ENABLE_RLS_ISOLATION is disabled, allows access to all data
 * (backward compatibility mode).
 *
 * @param server_id - The server ID from the request
 * @param serverInstance - The current AgentServer instance
 * @returns true if the server_id is valid for this request, false otherwise
 *
 * @example
 * const isValid = validateServerIdForRls(req.body.server_id, serverInstance);
 * if (!isValid) {
 *   return res.status(403).json({ error: 'Forbidden: server_id does not match' });
 * }
 */
export declare function validateServerIdForRls(server_id: UUID | string | undefined, serverInstance: AgentServer): boolean;
/**
 * Checks if RLS (Row Level Security) isolation is enabled
 *
 * @returns true if ENABLE_RLS_ISOLATION=true, false otherwise
 */
export declare function isRlsEnabled(): boolean;
