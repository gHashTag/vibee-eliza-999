import { IAgentRuntime, Service } from '@elizaos/core';
export interface TokenData {
    id?: string;
    symbol: string;
    name: string;
    address: string;
    chain?: string;
    decimals: number;
    totalSupply: string;
    price?: number;
    priceUsd: number;
    marketCapUsd: number;
    marketCapUSD?: number;
    volume24hUsd: number;
    volume24hUSD?: number;
    priceChange24h: number;
    priceChange24hPercent?: number;
    logoURI?: string;
    liquidity?: number;
    holders?: number;
    sourceProvider?: string;
    lastUpdatedAt?: Date;
    raw?: any;
}
/**
 * Dummy token data service for testing purposes
 * Provides mock implementations of token data operations
 */
export declare class DummyTokenDataService extends Service {
    static readonly serviceType = "token_data";
    capabilityDescription: string;
    get serviceName(): string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<DummyTokenDataService>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getTokenData(tokenAddress: string): Promise<TokenData>;
    getTokenDataBySymbol(symbol: string): Promise<TokenData>;
    getMultipleTokenData(tokenAddresses: string[]): Promise<TokenData[]>;
    getTokenDetails(address: string, chain?: string): Promise<any | null>;
    getTrendingTokens(chain?: string, limit?: number): Promise<TokenData[]>;
    searchTokens(query: string, chain?: string, limit?: number): Promise<TokenData[]>;
    getTokensByAddresses(addresses: string[], chain?: string): Promise<TokenData[]>;
    getDexName(): string;
}
//# sourceMappingURL=service.d.ts.map