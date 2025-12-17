
import { describe, it, expect } from "bun:test";
import { AGENTS_CONFIG } from "../config/agents.config";

describe("Agent Configuration Verification", () => {
    const cryptoChatId = "5082217642";
    const mainChatId = "2643951085";
    const adminForwardId = "2737186844";

    const vibee = AGENTS_CONFIG["vibee"];

    if (!vibee) {
        throw new Error("VIBEE agent not found in config");
    }

    it("should have correct global settings for VIBEE", () => {
       expect(vibee).toBeDefined();
       expect(vibee.username).toBe("neuro_sage"); 
    });

    describe(`Chat ${cryptoChatId} (Crypto)`, () => {
        const cryptoChat = vibee.targetChats.find(c => c.chatId === cryptoChatId);

        it("should be configured", () => {
            expect(cryptoChat).toBeDefined();
        });

        it("should have Sniper Mode enabled (0.0 response probability)", () => {
            expect(cryptoChat?.responseProbability).toBe(0.0);
        });

        it("should have correct trigger phrase", () => {
            expect(cryptoChat?.customTriggers).toContain("куплю крипту");
        });

        it("should have image generation DISABLED", () => {
            expect(cryptoChat?.allowImages).toBe(false);
        });

        it("should forward to the correct Lead Group", () => {
             expect(cryptoChat?.forwardChatId).toBe(adminForwardId);
        });
        
        it("should have writing enabled", () => {
            expect(cryptoChat?.canWrite).toBe(true);
        })
    });

    describe(`Chat ${mainChatId} (Main)`, () => {
        const mainChat = vibee.targetChats.find(c => c.chatId === mainChatId);

        it("should be configured", () => {
            expect(mainChat).toBeDefined();
        });

        it("should forward to the correct Lead Group", () => {
             expect(mainChat?.forwardChatId).toBe(adminForwardId);
        });
    });
});
