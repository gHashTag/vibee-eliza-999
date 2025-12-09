/**
 * Telegram Craft Plugin
 * Plugin for Telegram userbot functionality via MTProto (GramJS)
 */

import { Plugin } from "@elizaos/core";
import { TelegramService } from "./services/TelegramService";
import { sendMessageAction } from "./actions/sendMessageAction";
import { readHistoryAction } from "./actions/readHistoryAction";
import { getDialogsAction } from "./actions/getDialogsAction";
import { startGroupMonitoringAction } from "./actions/startGroupMonitoringAction";
import { addGroupToMonitorAction } from "./actions/addGroupToMonitorAction";
import { liveFeedAction } from "./actions/liveFeedAction";
import { recentMessagesProvider } from "./providers/recentMessagesProvider";
import { dialogsListProvider } from "./providers/dialogsListProvider";
import { capabilitiesProvider } from "./providers/capabilitiesProvider";
import { liveMessagesProvider } from "./providers/liveMessagesProvider";
import { autoMessageForwarderProvider } from "./providers/autoMessageForwarderProvider";
import { messageAutoForwardEvaluator } from "./evaluators/messageAutoForwardEvaluator";
import { McpAdapter } from "./adapters/McpAdapter";
import { MTProtoAdapter } from "./adapters/MTProtoAdapter";
import { BotApiAdapter } from "./adapters/BotApiAdapter";

export const telegramCraftPlugin: Plugin = {
  name: "telegram-craft",
  description:
    "ElizaOS plugin for Telegram userbot via MTProto (GramJS) with fallback strategies",
  services: [TelegramService],
  actions: [
    sendMessageAction,
    readHistoryAction,
    getDialogsAction,
    startGroupMonitoringAction,
    addGroupToMonitorAction,
    liveFeedAction,
  ],
  providers: [
    recentMessagesProvider,
    dialogsListProvider,
    capabilitiesProvider,
    liveMessagesProvider,
    autoMessageForwarderProvider,
  ],
  evaluators: [messageAutoForwardEvaluator],
};

export default telegramCraftPlugin;

// Export types and adapters
export { TelegramService };
export { McpAdapter, MTProtoAdapter, BotApiAdapter };
export { sendMessageAction, readHistoryAction, getDialogsAction };
export { startGroupMonitoringAction, addGroupToMonitorAction, liveFeedAction };
export {
  recentMessagesProvider,
  dialogsListProvider,
  capabilitiesProvider,
  liveMessagesProvider,
  autoMessageForwarderProvider,
};
