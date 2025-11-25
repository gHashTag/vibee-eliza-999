import { IAgentRuntime, Service } from '@elizaos/core';
export interface WalletPortfolio {
    totalValueUsd: number;
    assets: Array<{
        symbol: string;
        balance: number;
        valueUsd: number;
    }>;
}
/**
 * Dummy wallet service for testing purposes
 * Provides mock implementations of wallet operations
 */
export declare class DummyWalletService extends Service {
    static readonly serviceType = "wallet";
    capabilityDescription: string;
    private balances;
    private prices;
    private decimals;
    private quoteAsset;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<DummyWalletService>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getBalance(asset: string): Promise<bigint>;
    addFunds(asset: string, amount: number): void;
    setPortfolioHolding(asset: string, amount: number, price?: number): void;
    resetWallet(initialCash?: number, quoteAsset?: string): void;
    transferSol(from: string, to: string, amount: number): Promise<string>;
    getPortfolio(): any;
    get serviceName(): string;
}
//# sourceMappingURL=service.d.ts.map