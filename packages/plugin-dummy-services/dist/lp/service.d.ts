import { IAgentRuntime, Service } from '@elizaos/core';
export interface LpPositionDetails {
    poolAddress: string;
    tokenA: string;
    tokenB: string;
    liquidity: bigint;
    range?: {
        lower: number;
        upper: number;
    };
}
export interface PoolInfo {
    address: string;
    tokenA: string;
    tokenB: string;
    fee: number;
    liquidity: bigint;
    sqrtPriceX96: bigint;
    tick: number;
}
export interface TokenBalance {
    token: string;
    balance: bigint;
    decimals: number;
}
export interface TransactionResult {
    hash: string;
    success: boolean;
    error?: string;
}
/**
 * Dummy LP service for testing purposes
 * Provides mock implementations of liquidity pool operations
 */
export declare class DummyLpService extends Service {
    static readonly serviceType = "lp";
    capabilityDescription: string;
    constructor(runtime: IAgentRuntime);
    getDexName(): string;
    static start(runtime: IAgentRuntime): Promise<DummyLpService>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getPoolInfo(poolAddress: string): Promise<PoolInfo>;
    getPosition(positionId: string): Promise<LpPositionDetails | null>;
    addLiquidity(params: {
        poolAddress: string;
        tokenAMint: string;
        tokenBMint: string;
        tokenAAmountLamports: string;
        slippageBps: number;
    }): Promise<{
        success: boolean;
        transactionId?: string;
        lpTokensReceived?: any;
        error?: string;
    }>;
    removeLiquidity(params: {
        poolAddress: string;
        lpTokenMint: string;
        lpTokenAmountLamports: string;
        slippageBps: number;
    }): Promise<{
        success: boolean;
        transactionId?: string;
        tokensReceived?: any[];
        error?: string;
    }>;
    collectFees(positionId: string): Promise<TransactionResult>;
    getBalances(address: string): Promise<TokenBalance[]>;
    getPools(tokenAMint?: string): Promise<any[]>;
    getLpPositionDetails(userPublicKey: string, positionId: string): Promise<any>;
    getMarketDataForPools(poolIds: string[]): Promise<any>;
    swap(tokenIn: string, tokenOut: string, amountIn: bigint, minAmountOut: bigint, slippage?: number): Promise<TransactionResult>;
}
//# sourceMappingURL=service.d.ts.map