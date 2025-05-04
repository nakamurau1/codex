import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the class under test
vi.mock("node:fs/promises");
vi.mock("node:os");
vi.mock("../../utils/logger/log.js", () => ({ log: vi.fn() }));

import type { McpServerConfig } from "../../src/mcp/config";
import { McpConfigLoader } from "../../src/mcp/config";

// Helper needs a more specific type, but Record<string, unknown> or similar is okay for tests
const createMockConfig = (servers: Record<string, Partial<McpServerConfig>>) =>
  JSON.stringify({ mcpServers: servers });

describe("McpConfigLoader", () => {
  const mockHomedir = "/fake/home";
  const mockProjectDir = "/fake/project";
  const globalConfigPath = path.join(mockHomedir, ".codex", "mcp_config.json");
  const projectConfigPath = path.join(
    mockProjectDir,
    ".codex",
    "mcp_config.json",
  );

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(os, "homedir").mockReturnValue(mockHomedir);
    vi.spyOn(process, "cwd").mockReturnValue(mockProjectDir);
    vi.spyOn(fs, "readFile").mockRejectedValue({ code: "ENOENT" });
  });

  it("should return default empty config if no files are found", async () => {
    const loader = new McpConfigLoader();
    const config = await loader.loadConfig();
    expect(config).toEqual({ mcpServers: {} });
    expect(fs.readFile).toHaveBeenCalledWith(globalConfigPath, "utf-8");
    expect(fs.readFile).toHaveBeenCalledWith(projectConfigPath, "utf-8");
  });

  it("should load global config if only global file exists", async () => {
    const mockGlobalContent = createMockConfig({
      globalServer: { command: ["global-cmd"] },
    });
    vi.spyOn(fs, "readFile")
      .mockResolvedValueOnce(mockGlobalContent as any)
      .mockRejectedValue({ code: "ENOENT" });

    const loader = new McpConfigLoader();
    const config = await loader.loadConfig();

    expect(config.mcpServers).toBeDefined();
    expect(config.mcpServers?.["globalServer"]?.command).toEqual([
      "global-cmd",
    ]);
    expect(fs.readFile).toHaveBeenCalledWith(globalConfigPath, "utf-8");
  });

  it("should load project config if only project file exists", async () => {
    const mockProjectContent = createMockConfig({
      projectServer: { command: ["project-cmd"], enabled: false },
    });
    vi.spyOn(fs, "readFile")
      .mockRejectedValueOnce({ code: "ENOENT" })
      .mockResolvedValue(mockProjectContent as any);

    const loader = new McpConfigLoader();
    const config = await loader.loadConfig();

    expect(config.mcpServers).toBeDefined();
    expect(config.mcpServers?.["projectServer"]?.command).toEqual([
      "project-cmd",
    ]);
    expect(config.mcpServers?.["projectServer"]?.enabled).toBe(false);
  });

  it("should merge global and project configs, with project overriding global for non-objects/arrays", async () => {
    const mockGlobalContent = createMockConfig({
      sharedServer: {
        command: ["global-cmd"],
        env: { GLOBAL_VAR: "global", SHARED_VAR: "global" },
      },
      globalOnly: { command: ["global-only-cmd"] },
    });
    const mockProjectContent = createMockConfig({
      sharedServer: {
        command: ["project-cmd"],
        enabled: false,
        env: { PROJECT_VAR: "project", SHARED_VAR: "project" },
      }, // Override command, add enabled, merge env
      projectOnly: { command: ["project-only-cmd"] },
    });

    vi.spyOn(fs, "readFile")
      .mockResolvedValueOnce(mockGlobalContent as any)
      .mockResolvedValueOnce(mockProjectContent as any);

    const loader = new McpConfigLoader();
    const config = await loader.loadConfig();

    expect(config.mcpServers).toBeDefined();
    const sharedServer = config.mcpServers?.["sharedServer"];
    expect(config.mcpServers?.["globalOnly"]?.command).toEqual([
      "global-only-cmd",
    ]);
    expect(config.mcpServers?.["projectOnly"]?.command).toEqual([
      "project-only-cmd",
    ]);
    expect(sharedServer?.command).toEqual(["project-cmd"]);
    expect(sharedServer?.enabled).toBe(false);
    expect(sharedServer?.env).toEqual({
      GLOBAL_VAR: "global",
      SHARED_VAR: "project",
      PROJECT_VAR: "project",
    });
  });

  it("should handle invalid JSON in a config file gracefully", async () => {
    const invalidJsonContent = '{ "mcpServers": { "bad": { command: ["cmd" } }';
    vi.spyOn(fs, "readFile")
      .mockResolvedValueOnce(invalidJsonContent as any)
      .mockRejectedValue({ code: "ENOENT" });

    const loader = new McpConfigLoader();
    const config = await loader.loadConfig();
    expect(config).toEqual({ mcpServers: {} });
    // TODO: Assert log message
  });

  it("should handle schema validation errors gracefully", async () => {
    const invalidSchemaContent = createMockConfig({
      badSchema: { command: "not-an-array" },
    });
    vi.spyOn(fs, "readFile")
      .mockResolvedValueOnce(invalidSchemaContent as any)
      .mockRejectedValue({ code: "ENOENT" });

    const loader = new McpConfigLoader();
    const config = await loader.loadConfig();
    expect(config).toEqual({ mcpServers: {} });
    // TODO: Assert log message
  });

  it("should apply default values for optional fields", async () => {
    const minimalConfigContent = createMockConfig({
      minimalServer: { command: ["cmd"] },
    });
    vi.spyOn(fs, "readFile")
      .mockResolvedValueOnce(minimalConfigContent as any) // Keep `as any` here as mock data doesn't perfectly match type sometimes
      .mockRejectedValue({ code: "ENOENT" });

    const loader = new McpConfigLoader();
    const config = await loader.loadConfig();

    expect(config.mcpServers).toBeDefined();
    const server = config.mcpServers?.["minimalServer"]; // Use optional chaining
    expect(server).toBeDefined(); // Assert server exists after optional chaining
    // Now access properties using ! since we asserted server exists
    expect(server!.enabled).toBe(true);
    expect(server!.capabilities).toEqual({
      roots: false,
      sampling: false,
      logging: false,
    });
    expect(server!.env).toBeUndefined();
  });

  it("should handle config file having no mcpServers key", async () => {
    const noServersKeyContent = "{}";
    vi.spyOn(fs, "readFile")
      .mockResolvedValueOnce(noServersKeyContent as any)
      .mockRejectedValue({ code: "ENOENT" });

    const loader = new McpConfigLoader();
    const config = await loader.loadConfig();
    expect(config).toEqual({ mcpServers: {} });
  });
});
