import './index.css';
import React from 'react';
interface ElizaConfig {
    agentId: string;
    apiBase: string;
}
declare global {
    interface Window {
        ELIZA_CONFIG?: ElizaConfig;
    }
}
export interface AgentPanel {
    name: string;
    path: string;
    component: React.ComponentType<any>;
    icon?: string;
    public?: boolean;
    shortLabel?: string;
}
export declare const panels: AgentPanel[];
export * from './utils';
