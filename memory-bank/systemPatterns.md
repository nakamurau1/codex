# System Patterns

**Core Architecture:**
*   **`codex-rs`:** Contains the core Rust logic. Includes:
    *   Agent reasoning, execution sandboxing, OS/filesystem interactions.
    *   **`mcp-types` crate:** Defines MCP protocol data structures, generated from the official JSON schema via a Python script.
    *   **`mcp-server` crate:** Provides a basic MCP server implementation (e.g., for testing).
*   **`codex-cli`:** Provides the command-line interface (Node.js/TypeScript). Manages user interaction, prompts, orchestrates calls to `codex-rs` components, and will house the **MCP client implementation**.
*   **Language Models:** Interacts with OpenAI API or compatible alternatives.

**Key Technical Decisions:**
*   **Hybrid Language Stack:** Rust for core logic/performance, Node.js/TypeScript for CLI and client-side MCP integration.
*   **MCP Type Generation:** Uses a Python script (`generate_mcp_types.py`) to generate Rust types (`mcp-types`) from the official MCP JSON schema, ensuring protocol adherence.
*   **Sandboxing for Security:** Employs OS-specific sandboxing mechanisms (Apple Seatbelt on macOS, recommends Docker on Linux) to safely execute code generated or requested by the AI, restricting network access and file system writes by default.
*   **PNPM Workspaces:** Manages dependencies and links between the different parts of the project (e.g., `codex-cli`, potentially shared utilities).
*   **Nix Flakes:** Used for ensuring a reproducible development environment.
*   **Configuration:** Primarily via environment variables (`OPENAI_API_KEY`, etc.) and `.env` files, with additional configuration likely possible via CLI flags and potentially configuration files (`codex.md` for instructions, maybe others).
*   **Extensibility (Planned):** Adding support for Model Context Protocol (MCP) to allow interaction with a wide range of external tools and data sources.