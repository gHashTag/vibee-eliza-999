import { describe, it, expect } from "bun:test";
import { vibeFaceAvatarPlugin } from "../../index";

describe("NeuroPhoto Plugin Integration", () => {
  it("should have all required components", () => {
    expect(vibeFaceAvatarPlugin.actions).toBeDefined();
    expect(vibeFaceAvatarPlugin.actions?.length).toBeGreaterThan(0);
    expect(vibeFaceAvatarPlugin.providers).toBeDefined();
    expect(vibeFaceAvatarPlugin.services).toBeDefined();
  });

  it("should have correct name", () => {
    expect(vibeFaceAvatarPlugin.name).toBe("neurophoto");
  });
});
