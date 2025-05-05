import type { McpServerConfig } from "./config.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";

// Define possible states for the client instance
export enum McpClientStatus {
  IDLE = "IDLE",
  STARTING = "STARTING",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  DISCONNECTING = "DISCONNECTING",
  DISCONNECTED = "DISCONNECTED",
  ERROR = "ERROR",
}

export class McpClientInstance {
  private readonly serverName: string;
  private readonly config: McpServerConfig;

  private status: McpClientStatus = McpClientStatus.IDLE;
  private serverProcess: ChildProcessWithoutNullStreams | null = null;
  private transport: StdioClientTransport | null = null;
  private client: Client | null = null;

  constructor(serverName: string, config: McpServerConfig) {
    this.serverName = serverName;
    this.config = config;
  }

  // --- Methods for connection, disconnection, interaction will go here ---

  /**
   * Starts the MCP server process based on the configuration.
   * Handles process events like stderr, error, and exit.
   */
  private startServerProcess(): void {
    if (this.serverProcess) {
      // eslint-disable-next-line no-console
      console.warn(
        `[MCP:${this.serverName}] Server process already exists. Skipping start.`,
      );
      return;
    }
    if (
      this.status !== McpClientStatus.IDLE &&
      this.status !== McpClientStatus.DISCONNECTED
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `[MCP:${this.serverName}] Cannot start server process in status: ${this.status}`,
      );
      return;
    }

    // Validate command array
    if (!this.config.command || this.config.command.length === 0) {
      // eslint-disable-next-line no-console
      console.error(
        `[MCP:${this.serverName}] Invalid configuration: command array is empty.`,
      );
      this.status = McpClientStatus.ERROR;
      return;
    }

    this.status = McpClientStatus.STARTING;
    // eslint-disable-next-line no-console
    console.info(`[MCP:${this.serverName}] Starting server process...`);

    const [command, ...args] = this.config.command;
    // We validated that command array is not empty above, so command should exist.
    const commandToExecute = command!;

    const env = {
      ...process.env, // Inherit parent environment
      ...this.config.env, // Override with specific config
    };

    try {
      // eslint-disable-next-line no-console
      console.debug(
        `[MCP:${this.serverName}] Spawning command: ${commandToExecute} ${args.join(" ")}`,
      );
      const process = spawn(commandToExecute, args, {
        env,
        stdio: ["pipe", "pipe", "pipe"], // stdin, stdout, stderr
      });

      // Assign only after successful spawn
      this.serverProcess = process;

      // --- Attach listeners only if process is successfully created and non-null ---
      if (this.serverProcess) {
        this.serverProcess.stderr?.on("data", (data: Buffer) => {
          // eslint-disable-next-line no-console
          console.error(
            `[MCP:${this.serverName}] Server STDERR: ${data.toString().trim()}`,
          );
        });

        this.serverProcess.on("error", (err) => {
          // eslint-disable-next-line no-console
          console.error(
            `[MCP:${this.serverName}] Failed to start server process: ${err.message}`,
          );
          this.status = McpClientStatus.ERROR;
          this.serverProcess = null; // Clear the process reference
        });

        this.serverProcess.on("exit", (code, signal) => {
          const currentStatus = this.status; // Capture status before potentially changing it
          this.serverProcess = null; // Clear the process reference immediately

          if (
            currentStatus !== McpClientStatus.DISCONNECTING &&
            currentStatus !== McpClientStatus.DISCONNECTED
          ) {
            // eslint-disable-next-line no-console
            console.error(
              `[MCP:${this.serverName}] Server process exited unexpectedly with code ${code}, signal ${signal}`,
            );
            this.status = McpClientStatus.ERROR;
            // Clean up transport and client if they exist from a previous connection attempt
            this.transport?.close();
            this.client = null;
            this.transport = null;
          } else {
            // eslint-disable-next-line no-console
            console.info(
              `[MCP:${this.serverName}] Server process exited normally with code ${code}, signal ${signal}`,
            );
            this.status = McpClientStatus.DISCONNECTED;
            // Client and transport should have been cleaned up by disconnect method
          }
        });
      } else {
        // This case should theoretically not happen if spawn succeeds without error,
        // but handle defensively.
        // eslint-disable-next-line no-console
        console.error(
          `[MCP:${this.serverName}] Spawn seemed to succeed but serverProcess is null.`,
        );
        this.status = McpClientStatus.ERROR;
      }
      // --- End listeners ---
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        `[MCP:${this.serverName}] Error spawning server process: ${error}`,
      );
      this.status = McpClientStatus.ERROR;
      this.serverProcess = null;
      throw new Error(
        `Failed to spawn MCP server process for ${this.serverName}`,
      );
    }
  }

  // Getter for the current status
  public getStatus(): McpClientStatus {
    return this.status;
  }

  // Getter for the server name
  public getServerName(): string {
    return this.serverName;
  }
}
