/**
 * Centralized Infisical Cloud service for loading secrets
 * All packages should use this service for loading secrets from Infisical Cloud
 */
export interface InfisicalConfig {
    clientId: string;
    clientSecret: string;
    projectId: string;
    environment?: string;
}
/**
 * Load secrets from Infisical Cloud into process.env
 * This function should be called during application initialization
 * before any other code that might need access to secrets
 *
 * @param config - Infisical configuration (uses process.env if not provided)
 * @returns Promise that resolves when all secrets are loaded
 */
export declare function loadInfisicalSecrets(config?: Partial<InfisicalConfig>): Promise<void>;
/**
 * Service class for Infisical Cloud integration
 * Provides singleton pattern access to Infisical client
 */
export declare class InfisicalService {
    private static instance;
    private client;
    private isAuthenticated;
    /**
     * Get singleton instance of InfisicalService
     */
    static getInstance(): InfisicalService;
    /**
     * Initialize and authenticate with Infisical Cloud
     */
    initialize(config?: Partial<InfisicalConfig>): Promise<void>;
    /**
     * Get authenticated client
     */
    getClient(): any;
    /**
     * Load secrets using the service instance
     */
    loadSecrets(environment?: string): Promise<void>;
}
//# sourceMappingURL=infisicalService.d.ts.map