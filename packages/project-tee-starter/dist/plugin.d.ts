import type { Plugin } from '@elizaos/core';
import { type IAgentRuntime, Service } from '@elizaos/core';
/**
 * StarterService class for TEE functionality
 */
export declare class StarterService extends Service {
    static serviceType: string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<StarterService>;
    stop(): Promise<void>;
    get capabilityDescription(): string;
}
declare const teeStarterPlugin: Plugin;
export default teeStarterPlugin;
