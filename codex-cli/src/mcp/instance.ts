import type { McpServerConfig } from "./config.js";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import * as chokidar from "chokidar";

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
  private lastErrorMessages: Array<string> = [];
  private lastStderrOutput: Array<string> = [];
  private fileWatcher: chokidar.FSWatcher | null = null;
  private restartingDebounceTimer: NodeJS.Timeout | null = null;
  private static readonly RESTART_DEBOUNCE_MS = 1000;

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
      this.status !== McpClientStatus.DISCONNECTED &&
      this.status !== McpClientStatus.ERROR
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `[MCP:${this.serverName}] Cannot start server process in status: ${this.status}`,
      );
      return;
    }

    if (
      !this.config.command ||
      this.config.command.length === 0 ||
      !this.config.command[0] ||
      this.config.command[0].trim() === ""
    ) {
      // eslint-disable-next-line no-console
      console.error(
        `[MCP:${this.serverName}] Invalid configuration: command array or command is empty.`,
      );
      this.lastErrorMessages.push(
        "Invalid configuration: command array or command is empty.",
      );
      this.status = McpClientStatus.ERROR;
      return;
    }

    this.status = McpClientStatus.STARTING;
    this.lastErrorMessages = [];
    this.lastStderrOutput = [];
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
          this.lastStderrOutput.push(data.toString().trim());
        });

        this.serverProcess.on("error", (err) => {
          const errorMessage = `Failed to start server process: ${err.message}`;
          // eslint-disable-next-line no-console
          console.error(`[MCP:${this.serverName}] ${errorMessage}`);
          this.lastErrorMessages.push(errorMessage);
          if (err.stack) {
            this.lastErrorMessages.push(`Stack: ${err.stack}`);
          }
          this.status = McpClientStatus.ERROR;
          this.serverProcess = null;
        });

        this.serverProcess.on("exit", (code, signal) => {
          const currentStatus = this.status;
          this.serverProcess = null;

          const exitMessage = `Server process exited with code ${code}, signal ${signal}. Current status was ${currentStatus}.`;

          if (
            currentStatus !== McpClientStatus.DISCONNECTING &&
            currentStatus !== McpClientStatus.DISCONNECTED
          ) {
            // eslint-disable-next-line no-console
            console.error(
              `[MCP:${this.serverName}] ${exitMessage} (Unexpectedly)`,
            );
            this.lastErrorMessages.push(`${exitMessage} (Unexpectedly)`);
            this.status = McpClientStatus.ERROR;
            this.transport?.close();
            this.client = null;
            this.transport = null;
          } else {
            // eslint-disable-next-line no-console
            console.info(`[MCP:${this.serverName}] ${exitMessage} (Normally)`);
            if (this.status !== McpClientStatus.DISCONNECTED) {
              this.status = McpClientStatus.DISCONNECTED;
            }
          }
        });
      } else {
        const errorMessage =
          "Spawn seemed to succeed but serverProcess is null.";
        // eslint-disable-next-line no-console
        console.error(`[MCP:${this.serverName}] ${errorMessage}`);
        this.lastErrorMessages.push(errorMessage);
        this.status = McpClientStatus.ERROR;
      }
      // --- End listeners ---

      // If process started successfully, set up file watcher for stdio transport type
      if (this.serverProcess && this.config.command) {
        this._setupFileWatcher();
      }
    } catch (error) {
      const err = error as Error;
      const errorMessage = `Error spawning server process: ${err.message}`;
      // eslint-disable-next-line no-console
      console.error(`[MCP:${this.serverName}] ${errorMessage}`);
      this.lastErrorMessages.push(errorMessage);
      if (err.stack) {
        this.lastErrorMessages.push(`Stack: ${err.stack}`);
      }
      this.status = McpClientStatus.ERROR;
      this.serverProcess = null;
    }
  }

  // NEW: Method to set up file watcher
  private _setupFileWatcher(): void {
    if (this.fileWatcher) {
      // eslint-disable-next-line no-console
      console.info(
        `[MCP:${this.serverName}] File watcher already exists. Closing previous one.`,
      );
      this.fileWatcher.close();
      this.fileWatcher = null;
    }

    // Attempt to find a script file in the command array to watch
    // This is a simple heuristic and might need to be more robust or configurable
    const scriptExtensions = [".js", ".ts", ".py"];
    let scriptPathToWatch: string | null = null;

    for (const arg of this.config.command) {
      if (scriptExtensions.some((ext) => arg.endsWith(ext))) {
        // Basic check, does not confirm if it's an executable script passed to an interpreter
        // or the interpreter itself.
        // For node/python, it's usually `node myScript.js` or `python myScript.py`
        // We are interested in `myScript.js` or `myScript.py`
        // This assumes the script is a direct argument.
        // A more robust way would be to check fs.existsSync, but that's an async op.
        // For now, let's assume the first such argument is the target.
        scriptPathToWatch = arg; // This might not be a full path, chokidar might need absolute path
        // TODO: Resolve to absolute path if necessary and check existence
        break;
      }
    }

    if (scriptPathToWatch) {
      // eslint-disable-next-line no-console
      console.info(
        `[MCP:${this.serverName}] Attempting to watch script: ${scriptPathToWatch}`,
      );
      // Ensure path is absolute for chokidar for reliability
      // For now, if it's not starting with '/', assume it's relative to cwd (like in config tests)
      // This part needs to be robust based on how commands are specified and resolved.
      // Let's assume for now paths in `command` that are files are resolvable as is by chokidar
      // or are made absolute before this point if needed.

      try {
        this.fileWatcher = chokidar.watch(scriptPathToWatch, {
          persistent: true, // Keep watcher alive
          ignoreInitial: true, // Don't fire on initial add
          // awaitWriteFinish: { // Consider for stability if writes are atomic
          //   stabilityThreshold: 2000,
          //   pollInterval: 100
          // }
        });

        this.fileWatcher.on("change", (path: string) => {
          // eslint-disable-next-line no-console
          console.info(
            `[MCP:${this.serverName}] File ${path} has been changed. Triggering restart.`,
          );
          this._handleRestart();
        });

        this.fileWatcher.on("error", (err: unknown) => {
          let errorMessage = `Unknown file watcher error for ${scriptPathToWatch}`;
          if (err instanceof Error) {
            errorMessage = `File watcher error for ${scriptPathToWatch}: ${err.message}`;
            this.lastErrorMessages.push(errorMessage);
            if (err.stack) {
              this.lastErrorMessages.push(`Stack: ${err.stack}`);
            }
          } else {
            this.lastErrorMessages.push(errorMessage);
            this.lastErrorMessages.push(`Raw error object: ${String(err)}`);
          }
          // eslint-disable-next-line no-console
          console.error(`[MCP:${this.serverName}] ${errorMessage}`);
          // Optionally, stop watching or try to re-initialize watcher, or mark server as unstable.
          this.fileWatcher?.close(); // Stop watching on error for now
        });

        // eslint-disable-next-line no-console
        console.info(
          `[MCP:${this.serverName}] Watching ${scriptPathToWatch} for changes.`,
        );
      } catch (watchError) {
        // eslint-disable-next-line no-console
        console.error(
          `[MCP:${this.serverName}] Failed to initialize chokidar watch for ${scriptPathToWatch}: ${watchError}`,
        );
        this.lastErrorMessages.push(
          `Failed to initialize chokidar watch for ${scriptPathToWatch}: ${(watchError as Error).message}`,
        );
        this.fileWatcher = null;
      }
    } else {
      // eslint-disable-next-line no-console
      console.info(
        `[MCP:${this.serverName}] No specific script file found in command to watch for changes.`,
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

  // NEW: Dispose method for cleanup
  public dispose(): void {
    // eslint-disable-next-line no-console
    console.info(`[MCP:${this.serverName}] Disposing client instance...`);
    this.fileWatcher?.close();
    this.fileWatcher = null;

    if (this.serverProcess) {
      // eslint-disable-next-line no-console
      console.info(
        `[MCP:${this.serverName}] Killing server process (PID: ${this.serverProcess.pid})...`,
      );
      this.serverProcess.kill("SIGTERM"); // Or SIGKILL after a timeout
      // Consider awaiting process exit here or handling in 'exit' listener specifically for dispose path
      this.serverProcess = null; // Nullify immediately
    }
    // this.transport?.close(); // Will be handled by disconnect or when implementing connect/disconnect
    // this.client = null;      // Will be handled by disconnect or when implementing connect/disconnect
    this.status = McpClientStatus.DISCONNECTED; // Or a new DISPOSED status if needed
    // eslint-disable-next-line no-console
    console.info(`[MCP:${this.serverName}] Instance disposed.`);
  }

  // NEW: Private method to handle debounced server restart
  private _handleRestart(): void {
    if (this.restartingDebounceTimer) {
      clearTimeout(this.restartingDebounceTimer);
    }
    this.restartingDebounceTimer = setTimeout(async () => {
      // eslint-disable-next-line no-console
      console.info(
        `[MCP:${this.serverName}] Debounced: Proceeding with server restart...`,
      );
      if (
        this.status === McpClientStatus.DISCONNECTING ||
        this.status === McpClientStatus.STARTING ||
        this.status === McpClientStatus.CONNECTING
      ) {
        // eslint-disable-next-line no-console
        console.warn(
          `[MCP:${this.serverName}] Server is already in a transition state (${this.status}). Skipping restart for now.`,
        );
        return;
      }
      try {
        // eslint-disable-next-line no-console
        console.info(
          `[MCP:${this.serverName}] Attempting to disconnect for restart...`,
        );
        await this.disconnect(); // Assumes disconnect handles all cleanup including process and watcher
        // eslint-disable-next-line no-console
        console.info(
          `[MCP:${this.serverName}] Attempting to connect after restart...`,
        );
        await this.connect(); // Assumes connect will re-initialize everything including file watcher if needed
        // eslint-disable-next-line no-console
        console.info(
          `[MCP:${this.serverName}] Server restart sequence completed.`,
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `[MCP:${this.serverName}] Error during server restart sequence: ${error}`,
        );
        this.lastErrorMessages.push(
          `Error during server restart: ${(error as Error).message}`,
        );
        this.status = McpClientStatus.ERROR; // Ensure status reflects error if restart fails badly
      }
    }, McpClientInstance.RESTART_DEBOUNCE_MS);
  }

  // TODO: Implement connect, disconnect, listTools, callTool etc.
  public async connect(): Promise<void> {
    // Placeholder - to be implemented in Phase 2
    // This method should call startServerProcess and then establish MCP connection
    // For now, let's just log and set status for testing restart flow.
    // eslint-disable-next-line no-console
    console.info(`[MCP:${this.serverName}] connect() called (placeholder).`);
    if (
      this.status !== McpClientStatus.ERROR &&
      this.status !== McpClientStatus.IDLE &&
      this.status !== McpClientStatus.DISCONNECTED
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `[MCP:${this.serverName}] connect() called in unexpected state: ${this.status}`,
      );
      // return; // Or throw error
    }
    this.status = McpClientStatus.CONNECTING; // Simulate connection attempt
    // In a real scenario: this.startServerProcess(); then MCP handshake
    // For now, directly transition to CONNECTED to simulate success for restart testing
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async work
    this.status = McpClientStatus.CONNECTED;
    // eslint-disable-next-line no-console
    console.info(
      `[MCP:${this.serverName}] connect() finished (placeholder), status: ${this.status}.`,
    );
    // Crucially, if connect re-initializes things, it should also call _setupFileWatcher if process starts.
    // For now, _setupFileWatcher is called at the end of startServerProcess, which connect should invoke.
  }

  public async disconnect(): Promise<void> {
    // Placeholder - to be implemented in Phase 2
    // This method should stop the server process, close transport/client, and cleanup watchers.
    // eslint-disable-next-line no-console
    console.info(`[MCP:${this.serverName}] disconnect() called (placeholder).`);
    if (
      this.status === McpClientStatus.IDLE ||
      this.status === McpClientStatus.DISCONNECTED
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        `[MCP:${this.serverName}] disconnect() called in unexpected state: ${this.status}`,
      );
      // return; // Or throw error
    }
    this.status = McpClientStatus.DISCONNECTING;
    this.fileWatcher?.close();
    this.fileWatcher = null;
    this.serverProcess?.kill();
    this.serverProcess = null;
    // In a real scenario: await client.close(); await transport.close();
    await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async work
    this.status = McpClientStatus.DISCONNECTED;
    // eslint-disable-next-line no-console
    console.info(
      `[MCP:${this.serverName}] disconnect() finished (placeholder), status: ${this.status}.`,
    );
  }
}
