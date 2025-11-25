import { IAgentRuntime, Service } from '@elizaos/core';
export interface TranscriptionOptions {
    language?: string;
    model?: string;
    prompt?: string;
    temperature?: number;
    timestamps?: boolean;
}
export interface TranscriptionResult {
    text: string;
    language?: string;
    duration?: number;
    segments?: TranscriptionSegment[];
    words?: TranscriptionWord[];
}
export interface TranscriptionSegment {
    id: number;
    start: number;
    end: number;
    text: string;
    confidence?: number;
}
export interface TranscriptionWord {
    word: string;
    start: number;
    end: number;
    confidence?: number;
}
export interface SpeechToTextOptions extends TranscriptionOptions {
    format?: 'json' | 'text' | 'srt' | 'vtt';
}
export interface TextToSpeechOptions {
    voice?: string;
    speed?: number;
    pitch?: number;
    language?: string;
    format?: 'mp3' | 'wav' | 'ogg';
}
/**
 * Dummy transcription service for testing purposes
 * Provides mock implementations of transcription operations
 */
export declare class DummyTranscriptionService extends Service {
    static readonly serviceType: "transcription";
    capabilityDescription: string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<DummyTranscriptionService>;
    initialize(): Promise<void>;
    stop(): Promise<void>;
    transcribeAudio(audioBuffer: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult>;
    transcribeVideo(videoBuffer: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult>;
    speechToText(audioBuffer: Buffer, options?: SpeechToTextOptions): Promise<string | TranscriptionResult>;
    textToSpeech(text: string, options?: TextToSpeechOptions): Promise<Buffer>;
    detectLanguage(audioBuffer: Buffer): Promise<string>;
    translateAudio(audioBuffer: Buffer, targetLanguage: string, sourceLanguage?: string): Promise<TranscriptionResult>;
    getDexName(): string;
}
//# sourceMappingURL=service.d.ts.map