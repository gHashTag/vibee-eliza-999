/**
 * VIBEE Agents Package
 * Exports all available agents in the VIBEE ecosystem
 */

// Import character files
import neurophotoCharacter from "../characters/neurophoto.character.json";
import kolsAgentCharacter from "../characters/kolsAgent.character.json";

// Export characters
export const agents = {
  neurophoto: neurophotoCharacter,
  kols_agent: kolsAgentCharacter,
};

export { neurophotoCharacter, kolsAgentCharacter };
