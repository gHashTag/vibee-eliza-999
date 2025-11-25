import { IAgentRuntime, Service } from '@elizaos/core';
export interface BrowserNavigationOptions {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
    timeout?: number;
}
export interface ScreenshotOptions {
    fullPage?: boolean;
    quality?: number;
    type?: 'png' | 'jpeg';
}
export interface ElementSelector {
    selector: string;
    type?: 'css' | 'xpath';
}
export interface ExtractedContent {
    text?: string;
    html?: string;
    attributes?: Record<string, string>;
}
export interface ClickOptions {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
    delay?: number;
}
export interface TypeOptions {
    delay?: number;
    clearFirst?: boolean;
}
/**
 * Dummy browser service for testing purposes
 * Provides mock implementations of browser automation operations
 */
export declare class DummyBrowserService extends Service {
    static readonly serviceType: "browser";
    capabilityDescription: string;
    private currentUrl;
    private history;
    private historyIndex;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<DummyBrowserService>;
    initialize(): Promise<void>;
    stop(): Promise<void>;
    navigate(url: string, options?: BrowserNavigationOptions): Promise<void>;
    screenshot(options?: ScreenshotOptions): Promise<Buffer>;
    extractContent(selectors?: ElementSelector[]): Promise<ExtractedContent[]>;
    waitForSelector(selector: ElementSelector, timeout?: number): Promise<boolean>;
    click(selector: ElementSelector, options?: ClickOptions): Promise<void>;
    type(selector: ElementSelector, text: string, options?: TypeOptions): Promise<void>;
    evaluateScript<T = any>(script: string): Promise<T>;
    goBack(): Promise<void>;
    goForward(): Promise<void>;
    refresh(): Promise<void>;
    getUrl(): Promise<string>;
    getTitle(): Promise<string>;
    setCookies(cookies: any[]): Promise<void>;
    getCookies(): Promise<any[]>;
    clearCookies(): Promise<void>;
    getDexName(): string;
}
//# sourceMappingURL=service.d.ts.map