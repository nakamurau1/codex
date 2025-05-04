# System Patterns

**Core Architecture:**
*   **`codex-rs`:** Likely contains the core Rust logic, potentially handling agent reasoning, execution sandboxing, and interactions with the underlying OS or file system.
*   **`codex-cli`:** Provides the command-line interface, likely built using Node.js/TypeScript (based on `package.json`, `pnpm`). Manages user interaction, prompts, and orchestrates calls to the core Rust components and potentially external APIs/MCP servers.
*   **Language Models:** Interacts with OpenAI API (or compatible alternatives like Gemini, Ollama, etc.) for language understanding and generation.

**Key Technical Decisions:**
*   **Hybrid Language Stack:** Uses Rust for performance-critical or system-level tasks and Node.js/TypeScript for the CLI and potentially higher-level orchestration.
*   **Sandboxing for Security:** Employs OS-specific sandboxing mechanisms (Apple Seatbelt on macOS, recommends Docker on Linux) to safely execute code generated or requested by the AI, restricting network access and file system writes by default.
*   **PNPM Workspaces:** Manages dependencies and links between the different parts of the project (e.g., `codex-cli`, potentially shared utilities).
*   **Nix Flakes:** Used for ensuring a reproducible development environment.
*   **Configuration:** Primarily via environment variables (`OPENAI_API_KEY`, etc.) and `.env` files, with additional configuration likely possible via CLI flags and potentially configuration files (`codex.md` for instructions, maybe others).
*   **Extensibility (Planned):** Adding support for Model Context Protocol (MCP) to allow interaction with a wide range of external tools and data sources.