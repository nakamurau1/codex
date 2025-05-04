# Active Context

**Current Goal:** Implement support for Model Context Protocol (MCP) server interactions within the Codex CLI.

**Objective:** Allow Codex CLI to leverage external tools and data sources exposed via MCP servers, extending its capabilities beyond basic file operations and code execution.

**Next Steps:**
1.  Identify the appropriate module/files within the `codex-cli` codebase to integrate MCP client logic.
2.  Determine the mechanism for configuring and discovering MCP servers (e.g., configuration file, command-line arguments).
3.  Implement the core MCP client functionality (establishing connection, handling protocol messages, invoking tools).
4.  Integrate MCP tool calls into the agent's reasoning and execution loop.