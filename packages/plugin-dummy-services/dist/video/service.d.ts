import { IAgentRuntime, Service } from '@elizaos/core';
export interface VideoInfo {
    title: string;
    duration: number;
    resolution: {
        width: number;
        height: number;
    };
    format: string;
    size: number;
    fps: number;
    codec: string;
}
export interface VideoFormat {
    format: string;
    resolution: string;
    size: number;
    url?: string;
}
export interface VideoDownloadOptions {
    format?: string;
    quality?: 'highest' | 'lowest' | 'medium';
    audioOnly?: boolean;
}
export interface VideoProcessingOptions {
    startTime?: number;
    endTime?: number;
    outputFormat?: string;
    resolution?: string;
    fps?: number;
}
/**
 * Dummy video service for testing purposes
 * Provides mock implementations of video operations
 */
export declare class DummyVideoService extends Service {
    static readonly serviceType: "video";
    capabilityDescription: string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<DummyVideoService>;
    initialize(): Promise<void>;
    stop(): Promise<void>;
    getVideoInfo(url: string): Promise<VideoInfo>;
    downloadVideo(url: string, options?: VideoDownloadOptions): Promise<Buffer>;
    extractAudio(videoBuffer: Buffer): Promise<Buffer>;
    extractFrames(videoBuffer: Buffer, timestamps: number[]): Promise<Buffer[]>;
    processVideo(videoBuffer: Buffer, options: VideoProcessingOptions): Promise<Buffer>;
    getAvailableFormats(url: string): Promise<VideoFormat[]>;
    getDexName(): string;
}
//# sourceMappingURL=service.d.ts.map