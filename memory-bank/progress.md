# Progress

**Current Status:** Experimental, under active development.

**What Works (Based on README):**
*   Installation via `npm install -g @openai/codex`.
*   Basic CLI execution (interactive mode `codex`, prompt mode `codex "..."`).
*   API key configuration (env var, `.env` file).
*   Support for multiple AI providers via `--provider` flag or config.
*   Security sandboxing (macOS Seatbelt, Docker recommendation for Linux).
*   Approval modes (`Suggest`, `Auto Edit`, `Full Auto`).
*   Loading instructions from `codex.md`.
*   Non-interactive mode (`--quiet`).
*   Internal MCP infrastructure (Rust): `mcp-types` crate for protocol types and `mcp-server` for a basic test server exist.
*   Codex has been used successfully to contribute to its own development (e.g., generating `mcp-types`).

**What Needs Building / Next Steps:**
*   **Model Context Protocol (MCP) Client Integration (TypeScript):** This is the current primary focus. Requires designing configuration, implementing client logic in `codex-cli` using the TS SDK, and integrating tool calls into the agent workflow.
*   **Multimodal Input Handling:** README mentions support for screenshots/diagrams, but implementation details are likely pending.
*   **Refinement and Stability:** As an experimental project, ongoing work is needed for bug fixing, feature completion, and stabilization.
*   **Enhanced Sandboxing (Linux):** While Docker is recommended, built-in sandboxing might be explored.
*   **Network Whitelisting:** README mentions plans to allow specific network-enabled commands in the future.

**Known Issues/Challenges:**
*   Being experimental, bugs and incomplete features are expected.
*   Sandboxing effectiveness and cross-platform consistency might require ongoing attention.