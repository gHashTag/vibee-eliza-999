import { IAgentRuntime, Service } from '@elizaos/core';
export interface PdfExtractionResult {
    text: string;
    metadata?: {
        title?: string;
        author?: string;
        pages?: number;
        creationDate?: Date;
    };
}
export interface PdfGenerationOptions {
    format?: 'A4' | 'Letter' | 'Legal';
    margin?: {
        top?: number;
        bottom?: number;
        left?: number;
        right?: number;
    };
}
export interface PdfConversionOptions {
    quality?: number;
    dpi?: number;
}
/**
 * Dummy PDF service for testing purposes
 * Provides mock implementations of PDF operations
 */
export declare class DummyPdfService extends Service {
    static readonly serviceType: "pdf";
    capabilityDescription: string;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<DummyPdfService>;
    initialize(): Promise<void>;
    stop(): Promise<void>;
    extractText(pdfBuffer: Buffer): Promise<PdfExtractionResult>;
    generatePdf(content: string | {
        html: string;
    }, options?: PdfGenerationOptions): Promise<Buffer>;
    convertToPdf(input: Buffer, inputFormat: 'html' | 'markdown' | 'docx', options?: PdfConversionOptions): Promise<Buffer>;
    mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer>;
    splitPdf(pdfBuffer: Buffer, ranges: Array<[number, number]>): Promise<Buffer[]>;
    getDexName(): string;
}
//# sourceMappingURL=service.d.ts.map