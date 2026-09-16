import { describe, expect, it } from "vitest";
import { PUBLIC_COMMANDS, ADMIN_COMMANDS } from "../../src/bot/commands/commandList";

const COMMAND_NAME_RE = /^[a-z0-9_]{1,32}$/;

describe("bot command list (Telegram setMyCommands constraints)", () => {
  const all = [...PUBLIC_COMMANDS, ...ADMIN_COMMANDS];

  it("every command name is lowercase, 1-32 chars, [a-z0-9_] only", () => {
    for (const c of all) {
      expect(c.command).toMatch(COMMAND_NAME_RE);
    }
  });

  it("every description is 1-256 chars", () => {
    for (const c of all) {
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.description.length).toBeLessThanOrEqual(256);
    }
  });

  it("no duplicate command names across public + admin", () => {
    const names = all.map((c) => c.command);
    expect(new Set(names).size).toBe(names.length);
  });

  it("the combined list fits Telegram's 100-command-per-scope cap", () => {
    expect(all.length).toBeLessThanOrEqual(100);
  });
});
