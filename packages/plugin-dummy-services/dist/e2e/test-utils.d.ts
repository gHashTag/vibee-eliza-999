import { type IAgentRuntime, type Entity, type Room, type Content, type World } from '@elizaos/core';
/**
 * Sets up a standard scenario environment for an E2E test.
 *
 * This function creates a world, a user, and a room, providing an
 * isolated environment for each test case.
 *
 * @param runtime The live IAgentRuntime instance provided by the TestRunner.
 * @returns A promise that resolves to an object containing the created world, user, and room.
 */
export declare function setupScenario(runtime: IAgentRuntime): Promise<{
    user: Entity;
    room: Room;
    world: World;
}>;
/**
 * Simulates a user sending a message and waits for the agent's response.
 *
 * This function abstracts the event-driven nature of the message handler
 * into a simple async function, making tests easier to write and read.
 *
 * @param runtime The live IAgentRuntime instance.
 * @param room The room where the message is sent.
 * @param user The user entity sending the message.
 * @param text The content of the message.
 * @returns A promise that resolves with the agent's response content.
 */
export declare function sendMessageAndWaitForResponse(runtime: IAgentRuntime, room: Room, user: Entity, text: string): Promise<Content>;
//# sourceMappingURL=test-utils.d.ts.map