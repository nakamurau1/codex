// MCP Configuration Loader

import { log } from "../utils/logger/log.js";
import deepmerge from "deepmerge";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

// --- Type Definitions ---

const mcpServerCapabilitiesSchema = z
  .object({
    roots: z.boolean().optional().default(false),
    sampling: z.boolean().optional().default(false),
    logging: z.boolean().optional().default(false),
    // Future capabilities can be added here
  })
  .optional()
  .default({}); // Default to empty object if capabilities is undefined

export type McpServerCapabilities = z.infer<typeof mcpServerCapabilitiesSchema>;

const mcpServerConfigSchema = z.object({
  command: z.array(z.string()).min(1),
  env: z.record(z.string()).optional(),
  enabled: z.boolean().optional().default(true),
  capabilities: mcpServerCapabilitiesSchema,
  timeoutSeconds: z.number().int().positive().optional().default(30),
});

export type McpServerConfig = z.infer<typeof mcpServerConfigSchema>;

const mcpConfigSchema = z.object({
  mcpServers: z.record(mcpServerConfigSchema).optional().default({}), // Default to empty object if mcpServers is undefined
});

export type McpConfig = z.infer<typeof mcpConfigSchema>;

// --- Class Implementation ---

export class McpConfigLoader {
  // No constructor needed for now

  async loadConfig(): Promise<McpConfig> {
    log("Loading MCP configuration...");

    const globalConfigPath = path.join(
      os.homedir(),
      ".codex",
      "mcp_config.json",
    );
    // TODO: Determine the correct way to get project root instead of process.cwd()
    // For now, assuming process.cwd() is acceptable for CLI context or will be refined later.
    const projectRoot = process.cwd();
    const projectConfigPath = path.join(
      projectRoot,
      ".codex",
      "mcp_config.json",
    );

    log(`Global config path: ${globalConfigPath}`);
    log(`Project config path: ${projectConfigPath}`);

    const globalConfig =
      await this._loadAndValidateConfigFile(globalConfigPath);
    const projectConfig =
      await this._loadAndValidateConfigFile(projectConfigPath);

    log(`Global config loaded: ${!!globalConfig}`);
    log(`Project config loaded: ${!!projectConfig}`);

    // Merge configurations - project overrides global
    const baseConfig: McpConfig = { mcpServers: {} };
    // Use deepmerge with arrayMerge option to overwrite arrays instead of concatenating
    const arrayMergeOverwrite = <T>(
      target: Array<T>,
      source: Array<T>,
      _options?: deepmerge.Options,
    ): Array<T> => source;
    let mergedConfig: McpConfig = deepmerge<McpConfig>(
      baseConfig,
      globalConfig ?? {},
      {
        arrayMerge: arrayMergeOverwrite,
      },
    );
    mergedConfig = deepmerge<McpConfig>(mergedConfig, projectConfig ?? {}, {
      arrayMerge: arrayMergeOverwrite,
    });

    log(`Final merged MCP config: ${JSON.stringify(mergedConfig, null, 2)}`);

    return mergedConfig;
  }

  private async _loadAndValidateConfigFile(
    filePath: string,
  ): Promise<McpConfig | null> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      const jsonData = JSON.parse(fileContent);

      const validationResult = mcpConfigSchema.safeParse(jsonData);
      if (!validationResult.success) {
        // Log the specific Zod error messages for better debugging
        const errorMessages = validationResult.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ");
        log(`MCP config validation failed for ${filePath}: ${errorMessages}`);
        return null;
      }

      log(`Successfully loaded and validated MCP config from ${filePath}`);
      return validationResult.data;
    } catch (error) {
      // Type assertion for error object
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        log(`MCP config file not found at ${filePath}`);
      } else {
        log(
          `Error loading or parsing MCP config file ${filePath}: ${err.message}`,
        );
      }
      return null;
    }
  }
}
