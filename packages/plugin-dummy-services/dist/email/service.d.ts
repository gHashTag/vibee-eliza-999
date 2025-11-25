import { IAgentRuntime, Service } from '@elizaos/core';
export interface EmailAddress {
    name?: string;
    address: string;
}
export interface EmailAttachment {
    filename: string;
    content: Buffer | string;
    contentType?: string;
}
export interface EmailMessage {
    id: string;
    from: EmailAddress;
    to: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    subject: string;
    body: string;
    html?: string;
    attachments?: EmailAttachment[];
    date: Date;
    messageId?: string;
    inReplyTo?: string;
    references?: string[];
}
export interface EmailSendOptions {
    priority?: 'high' | 'normal' | 'low';
    readReceipt?: boolean;
    deliveryReceipt?: boolean;
}
export interface EmailSearchOptions {
    from?: string;
    to?: string;
    subject?: string;
    body?: string;
    since?: Date;
    before?: Date;
    hasAttachments?: boolean;
    folder?: string;
    limit?: number;
}
export interface EmailFolder {
    name: string;
    path: string;
    messageCount: number;
    unreadCount: number;
}
export interface EmailAccount {
    address: string;
    name?: string;
    provider: string;
}
/**
 * Dummy email service for testing purposes
 * Provides mock implementations of email operations
 */
export declare class DummyEmailService extends Service {
    static readonly serviceType: "email";
    capabilityDescription: string;
    private emails;
    private folders;
    constructor(runtime: IAgentRuntime);
    static start(runtime: IAgentRuntime): Promise<DummyEmailService>;
    initialize(): Promise<void>;
    stop(): Promise<void>;
    sendEmail(to: EmailAddress[], subject: string, body: string, options?: {
        cc?: EmailAddress[];
        bcc?: EmailAddress[];
        html?: string;
        attachments?: EmailAttachment[];
        sendOptions?: EmailSendOptions;
    }): Promise<string>;
    searchEmails(options?: EmailSearchOptions): Promise<EmailMessage[]>;
    getEmail(messageId: string): Promise<EmailMessage | null>;
    deleteEmail(messageId: string): Promise<boolean>;
    markAsRead(messageId: string): Promise<boolean>;
    markAsUnread(messageId: string): Promise<boolean>;
    moveToFolder(messageId: string, folderPath: string): Promise<boolean>;
    getFolders(): Promise<EmailFolder[]>;
    createFolder(name: string, parentPath?: string): Promise<EmailFolder>;
    deleteFolder(folderPath: string): Promise<boolean>;
    replyToEmail(messageId: string, body: string, options?: {
        html?: string;
        attachments?: EmailAttachment[];
        replyAll?: boolean;
    }): Promise<string>;
    forwardEmail(messageId: string, to: EmailAddress[], options?: {
        body?: string;
        html?: string;
        attachments?: EmailAttachment[];
    }): Promise<string>;
    getDexName(): string;
}
//# sourceMappingURL=service.d.ts.map