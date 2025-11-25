import { IAgentRuntime, Service } from '@elizaos/core';
export interface SearchOptions {
    query: string;
    limit?: number;
    offset?: number;
    language?: string;
    region?: string;
    safeSearch?: boolean;
}
export interface SearchResult {
    title: string;
    url: string;
    description: string;
    displayUrl?: string;
    source?: string;
    publishedDate?: Date;
    relevanceScore?: number;
    snippet?: string;
    thumbnail?: string;
}
export interface SearchResponse {
    results: SearchResult[];
    totalResults?: number;
    nextOffset?: number;
}
export interface NewsSearchOptions extends SearchOptions {
    sortBy?: 'relevance' | 'date';
    from?: Date;
    to?: Date;
    category?: string;
}
export interface ImageSearchOptions extends SearchOptions {
    size?: 'small' | 'medium' | 'large';
    type?: 'photo' | 'clipart' | 'gif' | 'transparent';
    color?: string;
}
export interface VideoSearchOptions extends SearchOptions {
    duration?: 'short' | 'medium' | 'long';
    resolution?: 'sd' | 'hd';
}
/**
 * Dummy web search service for testing purposes
 * Provides mock implementations of web search operations
 */
export declare class DummyWebSearchService extends Service {
    static readonly serviceType: "web_search";
    capabilityDescription: string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<DummyWebSearchService>;
    initialize(): Promise<void>;
    stop(): Promise<void>;
    search(options: SearchOptions): Promise<SearchResponse>;
    searchNews(options: NewsSearchOptions): Promise<SearchResponse>;
    searchImages(options: ImageSearchOptions): Promise<SearchResponse>;
    searchVideos(options: VideoSearchOptions): Promise<SearchResponse>;
    autocomplete(query: string): Promise<string[]>;
    getTrendingSearches(region?: string): Promise<string[]>;
    getRelatedSearches(query: string): Promise<string[]>;
    getDexName(): string;
}
//# sourceMappingURL=service.d.ts.map