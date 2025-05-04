# Active Context

**Current Goal:** Implement support for Model Context Protocol (MCP) server interactions within the Codex CLI.

**Objective:** Allow Codex CLI to leverage external tools and data sources exposed via MCP servers, extending its capabilities beyond basic file operations and code execution.

**Next Steps:**
1.  Identify the appropriate module/files within the `codex-cli` (TypeScript) codebase to integrate MCP client logic.
2.  Determine the mechanism for configuring and discovering MCP servers (e.g., configuration file, command-line arguments). Consider how this might interact with potential future use of the internal `mcp-server` Rust crate.
3.  Implement the core MCP client functionality in TypeScript, likely using the official `@modelcontextprotocol/ts-client` SDK. Ensure correct handling of protocol messages as defined (potentially referencing Rust's `mcp-types` for structure).
4.  Integrate MCP tool calls into the agent's reasoning and execution loop within the `codex-cli`.
5.  (Optional) Explore using the existing `mcp-server` Rust crate as a local test harness during client development.