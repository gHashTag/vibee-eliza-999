import { type IDatabaseAdapter } from '@elizaos/core';
/**
 * PostgreSQL Row-Level Security (RLS) for Multi-Tenant Isolation
 *
 * REQUIREMENT:
 * - RLS policies DO NOT apply to PostgreSQL superuser accounts.
 * - Use a REGULAR (non-superuser) database user
 * - Grant only necessary permissions (CREATE, SELECT, INSERT, UPDATE, DELETE)
 * - NEVER use the 'postgres' superuser or any superuser account
 *
 * Superusers bypass ALL RLS policies by design, which would completely
 * defeat the multi-tenant isolation mechanism.
 */
/**
 * Install PostgreSQL functions required for RLS
 * These are stored procedures that must be created with raw SQL
 */
export declare function installRLSFunctions(adapter: IDatabaseAdapter): Promise<void>;
/**
 * Get or create RLS owner using Drizzle ORM
 */
export declare function getOrCreateRlsOwner(adapter: IDatabaseAdapter, ownerId: string): Promise<string>;
/**
 * Set RLS context on PostgreSQL connection pool
 * This function validates that the owner exists and has correct UUID format
 */
export declare function setOwnerContext(adapter: IDatabaseAdapter, ownerId: string): Promise<void>;
/**
 * Assign agent to owner using Drizzle ORM
 */
export declare function assignAgentToOwner(adapter: IDatabaseAdapter, agentId: string, ownerId: string): Promise<void>;
/**
 * Apply RLS to all tables by calling PostgreSQL function
 */
export declare function applyRLSToNewTables(adapter: IDatabaseAdapter): Promise<void>;
/**
 * Disable RLS globally
 * SIMPLE APPROACH:
 * - Disables RLS for ALL servers/owners
 * - Keeps owner_id columns and data intact
 * - Use only in development or when migrating to single-server mode
 */
export declare function uninstallRLS(adapter: IDatabaseAdapter): Promise<void>;
