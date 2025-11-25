/**
 * Node-specific utils split out for server builds.
 */
export declare function expandTildePath(filepath: string): string;
export declare function resolveEnvFile(startDir?: string): string;
export declare function resolvePgliteDir(dir?: string, fallbackDir?: string): string;
