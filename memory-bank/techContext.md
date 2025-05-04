# Tech Context

**Primary Languages:**
*   Rust (`codex-rs`)
*   TypeScript/JavaScript (Node.js for `codex-cli`)

**Package/Dependency Management:**
*   PNPM (for Node.js/TypeScript workspace)
*   Cargo (for Rust)
*   Nix (for development environment provisioning via `flake.nix`)

**Key Frameworks/Libraries (Inferred):**
*   Node.js (Runtime for CLI)
*   Potentially libraries for argument parsing, API requests, terminal interaction within `codex-cli`.
*   Rust standard library and potentially crates for OS interaction, process management, sandboxing within `codex-rs`.

**Development Environment:**
*   **OS:** macOS 12+, Ubuntu 20.04+/Debian 10+, Windows 11 via WSL2.
*   **Node.js:** Version 22 or newer required.
*   **Git:** Version 2.23+ recommended.
*   **Nix:** Required for using the `flake.nix` development environment.

**External Dependencies/APIs:**
*   OpenAI API (or compatible providers like OpenRouter, Gemini, Ollama, Mistral, etc.) - Requires API key.
*   Model Context Protocol (MCP) Servers (to be integrated).

**Tooling:**
*   Prettier (Code formatting)
*   Husky (Git hooks)
*   git-cliff (Changelog generation)