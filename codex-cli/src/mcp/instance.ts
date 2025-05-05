import type { McpServerConfig } from "./config.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ChildProcessWithoutNullStreams } from "child_process";

// Define possible states for the client instance
export enum McpClientStatus {
  IDLE = "IDLE",
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
    // Initial status is IDLE
  }

  // --- Methods for connection, disconnection, interaction will go here ---

  // Getter for the current status
  public getStatus(): McpClientStatus {
    return this.status;
  }

  // Getter for the server name
  public getServerName(): string {
    return this.serverName;
  }
}
